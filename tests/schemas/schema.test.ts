import { loginSchema, updatePasswordSchema } from "../../src/schemas/auth.schema";
import {
  createCustomerSchema,
  paramCustomerSchema,
  updateCustomerSchema,
} from "../../src/schemas/customer.schema";
import {
  createItemBrandSchema,
  updateItemBrandSchema,
} from "../../src/schemas/item-brand.schema";
import {
  createItemTypeSchema,
  updateItemTypeSchema,
} from "../../src/schemas/item-type.schema";
import {
  updateItemFavoriteSchema,
  updateItemPriceSchema,
} from "../../src/schemas/item.schema";
import { createStoreSchema, updateStoreSchema } from "../../src/schemas/store.schema";
import { createUserSchema, updateUserSchema } from "../../src/schemas/user.schema";

/**
 * Uji kontrak API.
 *
 * Skema Zod ini MENGGANTIKAN rantai express-validator, dan penggantinya harus
 * berperilaku sama persis — termasuk KELONGGARANNYA. Tes di sini mengunci hal
 * itu: pesan yang keluar, urutannya, dan nilai-nilai longgar yang dulu lolos
 * harus tetap lolos. Klien Electron dan Flutter yang sudah berjalan bergantung
 * padanya.
 */

/** Pesan pertama yang gagal, atau "OK" kalau lolos — meniru validate.helper. */
const pesan = (schema: any, nilai: any): string => {
  const hasil = schema.safeParse(nilai);
  return hasil.success ? "OK" : hasil.error.issues[0].message;
};

const OID = "6a9564b908607adbb709f6a8";

describe("urutan pesan mengikuti urutan bidang", () => {
  it("pelanggan: nama diperiksa lebih dulu daripada alamat", () => {
    expect(pesan(createCustomerSchema, {})).toBe("Name is required");
    expect(pesan(createCustomerSchema, { name: "a" })).toBe(
      "Address is required"
    );
  });

  it("merek barang: nama lebih dulu daripada id, sesuai rantai lama", () => {
    expect(pesan(updateItemBrandSchema, {})).toBe("Name is required");
  });

  it("toko: id lebih dulu daripada sisanya", () => {
    expect(pesan(updateStoreSchema, {})).toBe("Id is required");
  });
});

describe("kelonggaran yang SENGAJA dipertahankan", () => {
  const pelanggan = { name: "A", address: "B", phone: "C", type: "bulk" };

  it("angka diterima di bidang teks — express-validator dulu begitu", () => {
    expect(pesan(createCustomerSchema, { ...pelanggan, name: 123 })).toBe("OK");
  });

  it("accessLevel berupa teks '2' tetap lolos", () => {
    expect(
      pesan(createUserSchema, { name: "a", username: "b", accessLevel: "2" })
    ).toBe("OK");
  });

  it("harga berupa teks '5' tetap lolos", () => {
    expect(
      pesan(updateItemPriceSchema, { items: [{ id: OID, price: "5" }] })
    ).toBe("OK");
  });

  it("password lama/baru boleh kosong — exists(), bukan notEmpty()", () => {
    expect(
      pesan(updatePasswordSchema, { oldPassword: "", newPassword: "" })
    ).toBe("OK");
  });

  it("id jenis barang hanya diperiksa ADA, bukan bentuknya", () => {
    expect(
      pesan(updateItemTypeSchema, { name: "x", description: "y", id: "abc" })
    ).toBe("OK");
  });
});

describe("yang tetap harus ditolak", () => {
  const pelanggan = { name: "A", address: "B", phone: "C", type: "bulk" };

  it("teks kosong bukan nilai yang sah untuk bidang wajib", () => {
    expect(pesan(createCustomerSchema, { ...pelanggan, name: "" })).toBe(
      "Name is required"
    );
    expect(pesan(loginSchema, { username: "a", password: "" })).toBe(
      "Password is required"
    );
  });

  it("tipe pelanggan di luar daftar ditolak", () => {
    expect(pesan(createCustomerSchema, { ...pelanggan, type: "retail" })).toBe(
      "Customer type is invalid"
    );
  });

  it("tipe pelanggan huruf besar tetap diterima", () => {
    expect(pesan(createCustomerSchema, { ...pelanggan, type: "BULK" })).toBe(
      "OK"
    );
  });

  it("id yang bukan ObjectId ditolak", () => {
    expect(pesan(paramCustomerSchema, { id: "abc" })).toBe("Id invalid");
    expect(pesan(updateCustomerSchema, { ...pelanggan, id: "abc" })).toBe(
      "Id invalid"
    );
  });

  it("harga negatif ditolak", () => {
    expect(
      pesan(updateItemPriceSchema, { items: [{ id: OID, price: -1 }] })
    ).toBe("Price cannot be negative");
  });

  it("items yang bukan larik ditolak dengan pesannya sendiri", () => {
    expect(pesan(updateItemPriceSchema, { items: "x" })).toBe("Items invalid");
  });

  it("isFavorite harus benar-benar boolean", () => {
    expect(
      pesan(updateItemFavoriteSchema, { itemID: OID, isFavorite: "ya" })
    ).toBe("Is favorite field is invalid");
  });

  it("deskripsi jenis barang wajib diisi", () => {
    expect(pesan(createItemTypeSchema, { name: "x" })).toBe(
      "Description is required"
    );
  });

  it("kode toko wajib saat pembuatan", () => {
    expect(
      pesan(createStoreSchema, {
        name: "a",
        prefix: "b",
        phoneNumber: "c",
        address: "d",
      })
    ).toBe("Code is required");
  });

  it("merek barang wajib punya nama", () => {
    expect(pesan(createItemBrandSchema, {})).toBe("Name is required");
  });

  it("pengguna wajib punya accessLevel", () => {
    expect(pesan(updateUserSchema, { name: "a", username: "b" })).toBe(
      "Id is required"
    );
  });
});
