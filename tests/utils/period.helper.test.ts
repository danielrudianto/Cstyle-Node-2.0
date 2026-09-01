import { monthFilter, monthRange } from "../../src/utils/period.helper";

/**
 * Mengunci kesetaraan penyaring bulan.
 *
 * Penyaring lama memakai $expr dengan $month/$year, yang pada MongoDB berjalan
 * di UTC. Penggantinya berupa rentang tanggal — dan rentang itu HARUS memilih
 * dokumen yang sama persis, bukan sekadar mirip. Kalau salah satu tes di sini
 * merah, angka pada seluruh laporan bulanan ikut bergeser.
 */

/** Meniru { $eq: [{ $month: "$date" }, m] } dan $year, yang memakai UTC. */
const cocokVersiLama = (d: Date, month: number, year: number) =>
  d.getUTCMonth() + 1 === month && d.getUTCFullYear() === year;

/** Meniru { date: { $gte, $lt } }. */
const cocokVersiBaru = (d: Date, month: number, year: number) => {
  const r = monthRange(month, year);
  return d >= r.$gte && d < r.$lt;
};

describe("monthRange", () => {
  it("mulai tepat di tengah malam UTC tanggal 1", () => {
    const r = monthRange(9, 2026);
    expect(r.$gte.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });

  it("berakhir tepat di tengah malam UTC awal bulan berikutnya", () => {
    const r = monthRange(9, 2026);
    expect(r.$lt.toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });

  it("Desember menyeberang ke Januari tahun berikutnya", () => {
    const r = monthRange(12, 2026);
    expect(r.$gte.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(r.$lt.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("Februari tahun kabisat berakhir setelah tanggal 29", () => {
    const r = monthRange(2, 2028);
    expect(r.$lt.toISOString()).toBe("2028-03-01T00:00:00.000Z");
    expect(cocokVersiBaru(new Date("2028-02-29T23:59:59.999Z"), 2, 2028)).toBe(
      true
    );
  });
});

describe("setara dengan penyaring $month/$year yang lama", () => {
  const kasus: Array<[string, number, number, boolean]> = [
    ["2026-09-01T00:00:00.000Z", 9, 2026, true],
    ["2026-09-30T23:59:59.999Z", 9, 2026, true],
    ["2026-08-31T23:59:59.999Z", 9, 2026, false],
    ["2026-10-01T00:00:00.000Z", 9, 2026, false],
    ["2025-09-15T12:00:00.000Z", 9, 2026, false],
    ["2026-12-31T23:59:59.999Z", 12, 2026, true],
    ["2027-01-01T00:00:00.000Z", 12, 2026, false],
  ];

  it.each(kasus)("%s pada %i/%i -> %s", (iso, month, year, harap) => {
    const d = new Date(iso);
    expect(cocokVersiBaru(d, month, year)).toBe(harap);
    /* Dan yang terpenting: sama dengan keputusan penyaring lama. */
    expect(cocokVersiBaru(d, month, year)).toBe(
      cocokVersiLama(d, month, year)
    );
  });

  it("sepakat pada seluruh hari di satu bulan penuh", () => {
    for (let hari = 1; hari <= 31; hari++) {
      for (const jam of [0, 12, 23]) {
        const d = new Date(Date.UTC(2026, 8, hari, jam));
        expect(cocokVersiBaru(d, 9, 2026)).toBe(cocokVersiLama(d, 9, 2026));
      }
    }
  });
});

describe("monthFilter", () => {
  it("membungkus rentang pada nama bidang yang diminta", () => {
    const f = monthFilter("createdAt", 3, 2026) as any;
    expect(Object.keys(f)).toEqual(["createdAt"]);
    expect(f.createdAt.$gte.toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });
});
