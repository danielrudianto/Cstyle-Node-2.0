export interface ProductMigrationInterface {
  id: string;
  reference: string;
  description: string;
  barcode: string | null;
  brand: string;
  type: string;
  price: number;
  brandID: string;
  typeID: string;
  isActive: boolean;
  images: string[];
}

export interface ProductImageMigrationInterface {
  id: string;
  images: string[];
}

export interface ProductBrandMigrationInterface {
  id: string;
  name: string;
}

export interface ProductTypeMigrationInterface {
  id: string;
  name: string;
}

export interface UserMigrationInterface {
  userID: string;
  code: string;
  name: string;
}
