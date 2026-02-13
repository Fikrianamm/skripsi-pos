export interface User {
  id?: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
  banned?: boolean;
  createdAt?: Date;
  accounts: {
    providerId: string;
  }[];
}
