export interface SupplierModelInterface {
  id?: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  npwp: string;
  createdBy: string;
  createdAt?: Date;
  isDelete?: boolean;
  deletedBy?: string;
  deletedAt?: Date;
}

export interface PreUpdateSupplierInterface {
  name: string;
  id: string;
}
