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

export interface ItemPreview {
  id: string;
  jumlah: number;
  bahanBaku: { nama: string; unit: { nama: string } | null };
}

export interface PenerimaanItem {
  id: string;
  tanggal: string;
  addedBy: { name: string; image?: string | null } | null;
  nomorFaktur: string | null;
  supplier: { id: string; nama: string; image?: string | null } | null;
  totalTagihan: number | string;
  buktiNota: string | null;
  items: ItemPreview[];
}

export interface DetailItem {
  id: string;
  jumlah: number;
  hargaBeli: number;
  totalHargaItem: number;
  bahanBaku: { nama: string; unit: { nama: string } | null };
}

export interface PenerimaanDetail {
  id: string;
  tanggal: string;
  nomorFaktur: string | null;
  keterangan: string | null;
  totalTagihan: number;
  buktiNota: string | null;
  supplier: { nama: string } | null;
  addedBy: { name: string } | null;
  items: DetailItem[];
}
export interface PengeluaranDetail {
  id: string;
  tanggal: string;
  keterangan: string | null;
  spk: {
    id: string;
    orderId: string;
    order: { nomorOrder: string; customer: { nama: string; image?: string | null } };
  } | null;
  addedBy: { name: string; image?: string | null; role: string } | null;
  items: {
    id: string;
    jumlah: number;
    bahanBaku: { nama: string; unit: { nama: string } | null };
  }[];
}

export interface PengeluaranItem {
  id: string;
  tanggal: string;
  keterangan: string | null;
  addedBy: { name: string; image?: string | null } | null;
  spk: {
    id: string;
    order: { nomorOrder: string; customer: { nama: string } };
  } | null;
  items: {
    id: string;
    jumlah: number;
    bahanBaku: { nama: string; unit: { nama: string } | null };
  }[];
}

export interface OpnameItemPreview {
  id: string;
  stokSistem: number;
  stokFisik: number;
  selisih: number;
  bahanBaku: { nama: string; unit: { nama: string } | null };
}

export interface StokOpnameItem {
  id: string;
  tanggal: string;
  keterangan: string | null;
  addedBy: { name: string; image?: string | null; role: string } | null;
  items: OpnameItemPreview[];
}

export interface StokOpnameDetail {
  id: string;
  tanggal: string;
  keterangan: string | null;
  addedBy: { name: string; image?: string | null; role: string } | null;
  items: OpnameItemPreview[];
}
