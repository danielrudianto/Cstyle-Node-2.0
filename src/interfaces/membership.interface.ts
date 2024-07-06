export interface MembershipInterface {
  id?: string;
  name: string;
  code: string;
  point: number;
  email: string | null;
  phoneNumber: string | null;
  nationality: string | null;
  language: string;
  createdBy: string;
  createdAt?: Date;
  birthday: Date;
  storeID: string;
}

export interface MembershipPointInterface {
  id?: string;
  conversion: number;
  createdBy: string;
  createdAt?: Date;
}
