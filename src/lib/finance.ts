import { prisma } from "@/lib/prisma";
import { Prisma } from "../../generated/prisma/client";

// DTO untuk pembuatan jurnal umum
export type JurnalEntryInput = {
  ref: string;
  tanggal: Date;
  keterangan: string;
  akunDebetId: string;
  akunKreditId: string;
  nominal: number;
  paymentId?: string;
  costId?: string;
  penerimaanId?: string;
  createdById?: string;
  deletedAt?: Date | null;
};

/**
 * createJurnalDoubleEntry
 * Fungsi utility untuk membuat jurnal double-entry otomatis.
 * Satu baris menyimpan akun Debet, Kredit, dan satu nilai nominal.
 */
export async function createJurnalDoubleEntry(
  input: JurnalEntryInput,
  tx?: Prisma.TransactionClient
) {
  const uniqueId = `j_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  const data = {
    id: uniqueId,
    ref: input.ref,
    tanggal: input.tanggal,
    keterangan: input.keterangan,
    akunDebetId: input.akunDebetId,
    akunKreditId: input.akunKreditId,
    nominal: new Prisma.Decimal(input.nominal),
    paymentId: input.paymentId,
    costId: input.costId,
    penerimaanId: input.penerimaanId,
    createdById: input.createdById,
    deletedAt: input.deletedAt,
  };

  if (tx) {
    return await tx.jurnalUmum.create({ data });
  } else {
    return await prisma.jurnalUmum.create({ data });
  }
}
