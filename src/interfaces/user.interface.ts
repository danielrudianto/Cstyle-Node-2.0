export interface UserInterface {
  _id?: string;
  name: string;
  username: string;
  password?: string;
  isActive: boolean;
  code: string;
  accessLevel: number;
  createdBy?: string;
  createdAt?: Date;
  deletedBy?: string;
  deletedAt?: Date;
}
