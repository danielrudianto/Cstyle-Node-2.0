import { z } from "zod";
import { ErrorList } from "../constants/error-list.constant";
import { mongoId } from "./common.schema";

/**
 * Kontrak API untuk laporan.
 *
 * Hanya PUT /report/sales yang divalidasi — keempat endpoint pembacaan laporan
 * membaca `month`, `year`, dan `store` dari badan permintaan tanpa pemeriksaan
 * apa pun. Bulan atau tahun yang bukan angka menghasilkan penyaring yang tidak
 * cocok dengan apa pun, lalu laporan kosong tanpa penjelasan. Dibiarkan sama.
 *
 * `invoices` dan `bills` sama-sama WAJIB berisi dan tidak boleh kosong — jadi
 * menyembunyikan hanya nota tanpa faktur, atau sebaliknya, akan ditolak.
 * Perilaku itu ada di rantai lama dan dipertahankan.
 */

const daftarPenanda = (pesanLarik: string, pesanID: string) =>
  z
    .any()
    .refine(
      (nilai) => Array.isArray(nilai) && nilai.length > 0,
      { message: pesanLarik }
    )
    .pipe(z.array(z.object({ id: mongoId(pesanID) })));

/** PUT /report/sales */
export const updateSalesReportSchema = z.object({
  invoices: daftarPenanda(
    ErrorList["INVOICE_REQUIRED"],
    ErrorList["INVOICE_ID_REQUIRED"]
  ),
  bills: daftarPenanda(
    ErrorList["BILL_REQUIRED"],
    ErrorList["BILL_ID_REQUIRED"]
  ),
});
