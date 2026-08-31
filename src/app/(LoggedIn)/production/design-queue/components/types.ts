export interface DesignFile {
  id: string;
  nama: string;
  filePath: string;
  createdAt: string;
  uploadedBy: { id: string; name: string } | null;
}

export interface KebutuhanBahanCustomItem {
  id: string;
  bahanBakuId: string;
  jumlahDibutuhkan: number | string;
  satuan: string;
  bahanBaku?: {
    id: string;
    nama: string;
    stok: number | string;
    unit?: { nama: string };
  };
}

export interface DesignOrderItem {
  id: string;
  nama: string;
  qty: number;
  statusHarga?: "NA" | "MENUNGGU_DESAIN" | "MENUNGGU_NEGOSIASI" | "DISEPAKATI";
  product?: { sku: string; isService?: boolean } | null;
  kebutuhanBahanCustom?: KebutuhanBahanCustomItem[];
}

export interface DesignOrder {
  id: string;
  nomorOrder: string;
  deadline: string | null;
  statusProduksi: string;
  catatan: string | null;
  createdAt: string;
  customer: { id: string; nama: string; nomorHp: string };
  items: DesignOrderItem[];
  designFiles: DesignFile[];
  spk: { id: string } | null;
  designerId: string | null;
  isDesignFinal: boolean;
  designReviewStatus: "PENDING_REVIEW" | "REVISI" | "ACC" | null;
  designer: { id: string; name: string; image: string | null } | null;
}
