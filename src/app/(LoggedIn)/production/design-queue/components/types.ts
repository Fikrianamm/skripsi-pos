export interface DesignFile {
  id: string;
  nama: string;
  filePath: string;
  createdAt: string;
  uploadedBy: { id: string; name: string } | null;
}

export interface DesignOrder {
  id: string;
  nomorOrder: string;
  deadline: string | null;
  statusProduksi: string;
  catatan: string | null;
  createdAt: string;
  customer: { id: string; nama: string; nomorHp: string };
  items: { nama: string; qty: number; product: { sku: string } | null }[];
  designFiles: DesignFile[];
  spk: { id: string } | null;
  designerId: string | null;
  isDesignFinal: boolean;
  designer: { id: string; name: string; image: string | null } | null;
}
