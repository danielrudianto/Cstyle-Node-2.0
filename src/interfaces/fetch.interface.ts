/** Masukan baku untuk pencarian berhalaman. */
export interface IFetch {
  keyword: string;
  page: number;
}

/**
 * Nama lama, dipertahankan selama masa peralihan.
 *
 * Hapus begitu tidak ada lagi model lama yang memakainya:
 *   grep -rn "FetchInterface" src
 */
export type FetchInterface = IFetch;
