import { Request, Response } from "express";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { BillRepository } from "../repositories/bill.repository";
import { ItemBrandRepository } from "../repositories/item-brand.repository";
import { ItemRepository } from "../repositories/item.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { ItemTypeRepository } from "../repositories/item-type.repository";
import LoggerHelper from "../utils/logger.helper";

/**
 * Lapisan HTTP untuk papan status.
 *
 * Controller ini menggabungkan angka dari banyak domain sekaligus, jadi ia
 * memang wajar menerima beberapa repository.
 *
 * CATATAN PERALIHAN: nota dan keanggotaan masih memakai model lama, karena
 * kedua domain itu belum digilir. Begitu keduanya punya repository, dua impor
 * model di atas ikut diganti dan controller ini tidak perlu berubah lagi.
 */
export class StatusController {
  private itemRepository: ItemRepository;
  private itemBrandRepository: ItemBrandRepository;
  private itemTypeRepository: ItemTypeRepository;
  private membershipRepository: MembershipRepository;
  private billRepository: BillRepository;

  constructor(
    itemRepository: ItemRepository,
    itemBrandRepository: ItemBrandRepository,
    itemTypeRepository: ItemTypeRepository,
    membershipRepository: MembershipRepository,
    billRepository: BillRepository
  ) {
    this.itemRepository = itemRepository;
    this.itemBrandRepository = itemBrandRepository;
    this.itemTypeRepository = itemTypeRepository;
    this.membershipRepository = membershipRepository;
    this.billRepository = billRepository;
  }

  fetchStatusDashboard = async (req: Request, res: Response) => {
    try {
      const [
        [memberCountStore, memberCountCountries],
        popularItems,
        [dailySales, weeklySales, biWeeklySales, monthlySales],
      ] = await Promise.all([
        this.membershipRepository.count(),
        this.itemRepository.fetchPopular(),
        this.billRepository.fetchStatus(),
      ]);

      return res.status(200).send({
        memberCount: memberCountStore.reduce(
          (a: any, b: any) => a + b.count,
          0
        ),
        popularItems: popularItems,
        memberMap: memberCountCountries
          .filter((x: any) => x._id != null)
          .map((x: any) => ({ count: x.count, nationality: x._id })),
        memberStoreMap: memberCountStore.map((x: any) => ({
          count: x.count,
          storeID: x.store,
        })),
        sales: {
          daily: dailySales.length == 0 ? 0 : dailySales[0].value,
          weekly: weeklySales.length == 0 ? 0 : weeklySales[0].value,
          biweekly: biWeeklySales.length == 0 ? 0 : biWeeklySales[0].value,
          monthly: monthlySales.length == 0 ? 0 : monthlySales[0].value,
        },
      });
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on fetching status dashboard ${error}`,
        tag: "Status",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchStatusMembership = async (req: Request, res: Response) => {
    try {
      const [[memberCount], memberNewCount, transactions] = await Promise.all([
        this.membershipRepository.count(),
        this.membershipRepository.countNewMembers(),
        this.billRepository.fetchMemberTransactions(),
      ]);

      return res.status(200).send({
        total: memberCount.reduce((a: any, b: any) => a + b.count, 0),
        recent: memberNewCount,
        recentTransactions: transactions,
      });
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching status membership ${error}`,
        tag: "Status",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchStatusItem = async (req: Request, res: Response) => {
    try {
      const [item, brand, type] = await Promise.all([
        this.itemRepository.count(),
        this.itemBrandRepository.count(),
        this.itemTypeRepository.count(),
      ]);

      return res.status(200).send({ item: item, brand: brand, type: type });
    } catch (error) {
      /*
        Kode lama tidak memasang penangkap galat di sini sama sekali, sehingga
        kegagalan berakhir sebagai unhandled rejection dan permintaan
        menggantung sampai klien menyerah. Sekarang dibalas 500.
      */
      new LoggerHelper({
        message: `Error on fetching status item ${error}`,
        tag: "Status",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };
}

export default StatusController;
