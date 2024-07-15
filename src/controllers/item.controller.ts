import { NextFunction, Request, Response } from "express";
import { ErrorList } from "../data/error-list";
import { LoggerType } from "../interfaces/logger.interface";
import fs from "fs";
import MigrationModelModel from "../models/migration.model";
import ItemModelModel from "../models/item.model";
import { queue } from "../utils/queue.utils";
import LoggerHelper from "../utils/logger.utils";

class ItemController {
  static createV2 = (req: Request, res: Response) => {
    const data = req.body;
    const item = JSON.parse(data.item);
    const reference = item.reference;
    const description = item.description;
    const itemTypeID = item.itemTypeID;
    const itemBrandID = item.itemBrandID;
    const price = item.price;
    const barcode = item.barcode;
    const createdBy = data.userID;
    const images = data.images as string[];

    ItemModelModel.preCreate({
      reference: reference,
      description: description,
      isActive: true,
    }).then((validation) => {
      if (!validation) {
        // Remove the uploaded images
        if (images.length > 0) {
          for (const image of images) {
            fs.unlinkSync(image);
          }
        }

        return res.status(400).send(ErrorList["ITEM_ALREADY_EXIST"]);
      } else {
        new ItemModelModel({
          reference: reference,
          description: description,
          itemTypeID: itemTypeID,
          itemBrandID: itemBrandID,
          createdBy: createdBy,
          price: price,
          barcode: barcode,
          isFavorite: false,
          images: images,
          isActive: true,
        })
          .create()
          .then(async (result) => {
            await queue.add("createProduct", {
              id: result._id,
            });

            if (images.length > 0) {
              await queue.add("createProductImage", {
                id: result._id,
              });
            }

            return res.status(200).send(result);
          })
          .catch((error) => {
            new LoggerHelper({
              type: LoggerType.error,
              message: `Error on creating item ${error}`,
              tag: "Item",
            }).log();
            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          });
      }
    });
  };

  static updateV2 = (req: Request, res: Response) => {
    const data = req.body;
    if ("item" in data) {
      const item = JSON.parse(data.item);

      const id = item.id;
      const reference = item.reference;
      const description = item.description;
      const itemTypeID = item.itemTypeID;
      const itemBrandID = item.itemBrandID;
      const price = item.price;
      const barcode = item.barcode;
      const isActive = item.isActive;

      const newImages = req.body.images;

      ItemModelModel.preUpdate({
        reference: reference,
        id: id,
        isActive: isActive,
      })
        .then(async (validation) => {
          if (!validation) {
            return res.status(404).send(ErrorList["ITEM_NOT_FOUND"]);
          } else {
            const product = await ItemModelModel.fetchByID(id);
            if (!product) {
              return res.status(404).send(ErrorList["ITEM_NOT_FOUND"]);
            }

            new ItemModelModel({
              id: id,
              reference: reference,
              description: description,
              itemTypeID: itemTypeID,
              itemBrandID: itemBrandID,
              price: price,
              barcode: barcode,
              images: [...product.images, ...newImages],
              isActive: isActive,
            })
              .update()
              .then(async (result) => {
                await queue.add("updateProduct", {
                  id: id,
                });

                if (newImages.length > 0) {
                  await queue.add("updateProductImage", {
                    id: id,
                    images: newImages,
                  });
                }
                return res.status(201).send(result);
              })
              .catch((error) => {
                new LoggerHelper({
                  type: LoggerType.error,
                  message: `Error on updating item ${error}`,
                  tag: "Item",
                }).log();
              });
          }
        })
        .catch((error) => {
          new LoggerHelper({
            type: LoggerType.error,
            message: `Error on pre-creating item ${error}`,
            tag: "Item",
          }).log();
          return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
        });
    } else {
      return res.status(400).send(ErrorList["BAD_REQUEST"]);
    }
  };

  static updateFavoriteStatus = (req: Request, res: Response) => {
    const isFavorite = req.body.isFavorite;
    const itemID = req.body.itemID;

    ItemModelModel.updateFavoriteStatus({
      id: itemID,
      isFavorite: isFavorite,
    })
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on updating item favorite status ${error}`,
          tag: "Item",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static deleteByID = (req: Request, res: Response) => {
    const id = req.params.id;
    const userID = req.body.userID;
    ItemModelModel.preDelete(id).then((validation) => {
      if (!validation) {
        return res.status(404).send(ErrorList["ITEM_NOT_FOUND"]);
      } else {
        ItemModelModel.delete({
          id: id,
          userID: userID,
        })
          .then(async (result) => {
            // Delete the file
            if (result == null) {
              return res.status(404).send(ErrorList["ITEM_NOT_FOUND"]);
            } else {
              const images = result.images;
              for (const image of images) {
                fs.unlinkSync(image);
              }

              await queue.add("deleteProduct", {
                id: id,
              });

              return res.status(200).send(result);
            }
          })
          .catch((error) => {
            new LoggerHelper({
              type: LoggerType.error,
              message: `Error on deleting item ${error}`,
              tag: "Item",
            }).log();
            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          });
      }
    });
  };

  static deleteImage = (req: Request, res: Response) => {
    const fileName = req.params.name;
    const itemID = req.params.id;
    // Check if the file exists in upload
    if (fs.existsSync(`upload/${fileName}`)) {
      fs.unlinkSync(`upload/${fileName}`);
      Promise.all([
        ItemModelModel.deleteImage(`upload/${fileName}`, itemID),
        MigrationModelModel.deleteProductImage(`upload/${fileName}`, itemID),
      ])
        .then(([result, _]) => {
          return res.status(200).send(result);
        })
        .catch((error) => {
          new LoggerHelper({
            type: LoggerType.error,
            message: `Error on deleting item image ${error}`,
            tag: "Item",
          }).log();

          return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
        });
    } else {
      return res.status(404).send(ErrorList["ITEM_NOT_FOUND"]);
    }
  };

  static fetchV2 = (req: Request, res: Response) => {
    const page = !req.query.page ? 1 : parseInt(req.query.page as string);
    const keyword = !req.query.keyword ? "" : (req.query.keyword as string);
    ItemModelModel.fetch({
      keyword: keyword,
      page: page,
    })
      .then(([result, count]) => {
        return res.status(200).send({
          data: result,
          count: count,
        });
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching item ${error}`,
          type: LoggerType.error,
          tag: "Item",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchByBranchV2 = (req: Request, res: Response) => {
    const page = req.body.page;
    const keyword = req.body.keyword;
    const branch = req.body.branch;
    const onlyActive = !req.body.onlyActive ? false : req.body.onlyActive;
    // If keyword length is 13 and all characters are numbers, search by barcode
    ItemModelModel.fetchV2WStock({
      keyword: keyword,
      page: page,
      branch: branch,
      onlyActive: onlyActive,
    })
      .then(([result, count]) => {
        return res.status(200).send({
          data: result,
          count: count,
        });
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching item ${error}`,
          type: LoggerType.error,
          tag: "Item",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchPrice = (req: Request, res: Response) => {
    const type = req.body.type;
    const brand = req.body.brand;

    ItemModelModel.fetchPrices({
      brand: brand,
      type: type,
    })
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching item price ${error}`,
          type: LoggerType.error,
          tag: "Item",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchByID = (req: Request, res: Response) => {
    const id = req.params.id;
    ItemModelModel.fetchByID(id)
      .then((x) => {
        if (!x) {
          return res.status(404).send(ErrorList["ITEM_NOT_FOUND"]);
        } else {
          return res.status(200).send({
            _id: id,
            reference: x.reference,
            description: x.description,
            createdAt: x.createdAt,
            createdBy: x.createdBy,
            images: (x.images as string[]).map((z) => {
              return `${process.env.BASE_URL}/${z}`;
            }),
            brandID: (x.itemBrandID as any)._id,
            typeID: (x.itemTypeID as any)._id,
            itemBrand: {
              name: (x.itemBrandID as any).name,
              _id: (x.itemBrandID as any)._id,
            },
            itemType: {
              name: (x.itemTypeID as any).name,
              description: (x.itemTypeID as any).description,
              _id: (x.itemTypeID as any)._id,
            },
            price: x.price,
            barcode: x.barcode,
            isActive: x.isActive,
          });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching item ${error}`,
          type: LoggerType.error,
          tag: "Item",
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };
}

export default ItemController;
