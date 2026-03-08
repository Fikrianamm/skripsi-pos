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

export interface Supplier {
  id?: string;
  nama: string;
  email: string;
  nomorHp: string;
  image?: string | null;
  alamat: string;
  isActive: boolean;
  keterangan?: string;
  createdAt?: Date;
}

export interface Customer {
  id?: string;
  nama: string;
  nomorHp: string;
  image?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Product {
  id?: string;
  sku: string;
  nama: string;
  image: string;
  hpp: number;
  hargaJual: number;
  stok: number;
  minStok: number;
  isService: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  category: Category;
  unit: Unit;
}

export interface Category {
  id?: string;
  nama: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Unit {
  id?: string;
  nama: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Karyawan {
  id?: string;
  nama: string;
  nomorHp?: string | null;
  posisi?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type StockStatus = {
  label: string;
  color: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
};

export interface BahanBaku {
  id?: string;
  nama: string;
  unitId: string;
  stok: number;
  minStok?: number | null;
  keterangan?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  unit?: { id: string; nama: string };
  _count?: { stokMasuk: number };
}

export interface StokMasuk {
  id?: string;
  bahanBakuId: string;
  supplierId?: string | null;
  jumlah: number;
  hargaBeli?: number | null;
  nomorFaktur?: string | null;
  tanggal: Date | string;
  keterangan?: string | null;
  createdAt?: Date;
  supplier?: { id: string; nama: string } | null;
}
