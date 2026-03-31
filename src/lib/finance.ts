import { prisma } from "@/lib/prisma";
import { Divisi, SumberJurnal } from "../../generated/prisma/client";
import { Prisma } from "../../generated/prisma/client";

// DTO untuk pembuatan jurnal umum
export type JurnalEntryInput = {
  ref: string;
  tanggal: Date;
  keterangan: string;
  akunDebetId: string;
  akunKreditId: string;
  nominal: number;
  sumber: SumberJurnal;
  divisi?: Divisi;
  paymentId?: string;
  costId?: string;
  tabunganId?: string;
  createdById?: string;
};

/**
 * createJurnalDoubleEntry
 * Fungsi utility untuk membuat jurnal double-entry otomatis.
 * Karena skema JurnalUmum mensyaratkan 1 baris menyimpan akun Debet dan Kredit sekaligus:
 */
export async function createJurnalDoubleEntry(
  input: JurnalEntryInput,
  tx?: Prisma.TransactionClient
) {
  const bulan = input.tanggal.getMonth() + 1;
  const tahun = input.tanggal.getFullYear();

  // Gunakan ID unik untuk Jurnal
  const uniqueId = `j_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  const jurnalDataValue = {
    id: uniqueId,
    ref: input.ref,
    tanggal: input.tanggal,
    keterangan: input.keterangan,
    akunDebetId: input.akunDebetId,
    akunKreditId: input.akunKreditId,
    debet: new Prisma.Decimal(input.nominal),
    kredit: new Prisma.Decimal(input.nominal),
    bulan: bulan,
    tahun: tahun,
    sumber: input.sumber,
    divisi: input.divisi || "HQ", // Default ke HQ jika tidak diset
    paymentId: input.paymentId,
    costId: input.costId,
    tabunganId: input.tabunganId,
    createdById: input.createdById,
  };

  if (tx) {
    // Jalankan dalam rentetan transaksi yang sama (Transaction Client)
    return await tx.jurnalUmum.create({
      data: jurnalDataValue,
    });
  } else {
    // Jalankan terpisah (standalone)
    return await prisma.jurnalUmum.create({
      data: jurnalDataValue,
    });
  }
}
