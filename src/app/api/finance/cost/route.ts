/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJurnalDoubleEntry } from "@/lib/finance";

async function requireAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return { error: "Unauthorized", status: 401, session: null };
  if (session.user.role !== "admin" && session.user.role !== "kasir")
    return { error: "Forbidden", status: 403, session: null };
  return { error: null, status: 200, session };
}

// GET /api/finance/cost
export async function GET(request: NextRequest) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const sp     = request.nextUrl.searchParams;
    const search = sp.get("search") || "";
    const akunId = sp.get("akunId") || "";
    const page   = sp.get("page")   || "1";
    const limit  = sp.get("limit")  || "10";
    const bulan  = sp.get("bulan")  || "";
    const tahun  = sp.get("tahun")  || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { nama:       { contains: search } },
        { keterangan: { contains: search } },
      ];
    }

    if (akunId) where.akunId = akunId;

    // Filter bulan / tahun
    if (bulan && tahun) {
      const b = parseInt(bulan);
      const y = parseInt(tahun);
      where.tanggal = {
        gte: new Date(y, b - 1, 1),
        lte: new Date(y, b, 0, 23, 59, 59, 999),
      };
    } else if (tahun) {
      const y = parseInt(tahun);
      where.tanggal = {
        gte: new Date(y, 0, 1),
        lte: new Date(y, 11, 31, 23, 59, 59, 999),
      };
    }

    const [results, count] = await Promise.all([
      prisma.cost.findMany({
        orderBy: { tanggal: "desc" },
        include: {
          akun: { select: { id: true, namaAkun: true, kelompok: true } },
          user: { select: { id: true, name: true, image: true } },
          jurnalUmum: {
            where: { deletedAt: null },
            take: 1,
            include: {
              akunKredit: { select: { namaAkun: true, kelompok: true } },
            },
          },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        where,
      }),
      prisma.cost.count({ where }),
    ]);

    const totalPages = Math.ceil(count / Number(limit));

    return NextResponse.json({ results, count, totalPages });
  } catch (err) {
    console.error("[COST GET ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/finance/cost
export async function POST(request: NextRequest) {
  try {
    const { error, status, session } = await requireAccess();
    if (error || !session) return NextResponse.json({ error }, { status });

    const body = await request.json();
    const { akunId, nama, nominal, keterangan, buktiNota, tanggal, kasBankId } = body;

    if (!akunId)
      return NextResponse.json({ error: "Akun beban harus dipilih." }, { status: 400 });

    if (!nominal || nominal <= 0)
      return NextResponse.json({ error: "Nominal harus lebih dari 0." }, { status: 400 });

    if (!kasBankId)
      return NextResponse.json({ error: "Rekening Kas/Bank sumber dana harus dipilih." }, { status: 400 });

    const kasBank = await prisma.kasBank.findUnique({
      where: { id: kasBankId },
      include: { akun: true },
    });
    if (!kasBank || !kasBank.akunId)
      return NextResponse.json({ error: "Rekening sumber dana Kas/Bank tidak valid." }, { status: 400 });

    const akunBeban = await prisma.akun.findUnique({ where: { id: akunId } });
    if (!akunBeban)
      return NextResponse.json({ error: "Akun beban tidak valid." }, { status: 400 });

    const costId      = crypto.randomUUID();
    const realTanggal = tanggal ? new Date(tanggal) : new Date();

    const [cost] = await prisma.$transaction(async (tx) => {
      // 1. Catat Pengeluaran
      const newCost = await tx.cost.create({
        data: {
          id: costId,
          akunId,
          userId: session.user.id,
          nama,
          nominal: Number(nominal),
          keterangan: keterangan || null,
          buktiNota:  buktiNota  || null,
          tanggal:    realTanggal,
        },
      });

      // Note: Saldo KasBank sekarang bersifat dinamis dan diekstrak via JurnalUmum.
      // Jadi update secara spesifik ke record kasBank tidak lagi diperlukan di sini.

      // 3. Catat Jurnal UMUM (Double-Entry)
      //    Debet = Akun Beban, Kredit = Akun Kas/Bank
      await createJurnalDoubleEntry(
        {
          ref:          `CST-${costId.slice(0, 5)}`,
          tanggal:      realTanggal,
          keterangan:   `Pengeluaran: ${nama}${keterangan ? " - " + keterangan : ""}`,
          akunDebetId:  akunId,
          akunKreditId: kasBank.akunId!,
          nominal:      Number(nominal),
          costId,
          createdById:  session.user.id,
        },
        tx as any,
      );

      return [newCost];
    });

    return NextResponse.json({ message: "Pengeluaran berhasil dicatat", cost }, { status: 201 });
  } catch (err) {
    console.error("[COST CREATE ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/finance/cost?id=xxx
export async function PATCH(request: NextRequest) {
  try {
    const { error, status, session } = await requireAccess();
    if (error || !session) return NextResponse.json({ error }, { status });

    const sp = request.nextUrl.searchParams;
    const id = sp.get("id");
    if (!id) return NextResponse.json({ error: "ID pengeluaran diperlukan." }, { status: 400 });

    const body = await request.json();
    const { akunId, nama, nominal, keterangan, buktiNota, tanggal, kasBankId } = body;

    const oldCost = await prisma.cost.findUnique({
      where: { id },
      include: {
        jurnalUmum: { where: { deletedAt: null }, take: 1 },
      },
    });

    if (!oldCost) return NextResponse.json({ error: "Data pengeluaran tidak ditemukan." }, { status: 404 });

    const oldJurnal = oldCost.jurnalUmum[0];

    const kasBank = kasBankId
      ? await prisma.kasBank.findUnique({ where: { id: kasBankId }, include: { akun: true } })
      : null;

    if (kasBankId && (!kasBank || !kasBank.akunId)) {
      return NextResponse.json({ error: "Rekening Kas/Bank tidak valid." }, { status: 400 });
    }

    const realTanggal = tanggal ? new Date(tanggal) : oldCost.tanggal;
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Soft Delete & Reversal Jurnal Lama (Hanya jika masih ada)
      if (oldJurnal) {
        await tx.jurnalUmum.update({
          where: { id: oldJurnal.id },
          data: { deletedAt: now },
        });

        await createJurnalDoubleEntry({
          ref: `REV-${oldJurnal.ref}`,
          tanggal: now,
          keterangan: `Reversal untuk: ${oldJurnal.keterangan}`,
          akunDebetId: oldJurnal.akunKreditId,
          akunKreditId: oldJurnal.akunDebetId,
          nominal: Number(oldJurnal.nominal),
          costId: id,
          createdById: session.user.id,
          deletedAt: now,
        }, tx as any);
      }

      // 3. Update Data Cost
      const updatedCost = await tx.cost.update({
        where: { id },
        data: {
          akunId: akunId || oldCost.akunId,
          nama: nama || oldCost.nama,
          nominal: nominal !== undefined ? Number(nominal) : oldCost.nominal,
          keterangan: keterangan !== undefined ? (keterangan || null) : oldCost.keterangan,
          buktiNota: buktiNota !== undefined ? (buktiNota || null) : oldCost.buktiNota,
          tanggal: realTanggal,
        },
      });

      // 4. Buat Jurnal Baru (Benar)
      await createJurnalDoubleEntry({
        ref: `CST-${id.slice(0, 5)}`,
        tanggal: realTanggal,
        keterangan: `Pengeluaran (Koreksi): ${updatedCost.nama}${updatedCost.keterangan ? " - " + updatedCost.keterangan : ""}`,
        akunDebetId: updatedCost.akunId,
        akunKreditId: kasBank?.akunId || (oldJurnal ? oldJurnal.akunKreditId : oldCost.akunId),
        nominal: Number(updatedCost.nominal),
        costId: id,
        createdById: session.user.id,
      }, tx as any);

      return updatedCost;
    });

    return NextResponse.json({ message: "Pengeluaran berhasil dikoreksi (reversal applied)", cost: result });
  } catch (err) {
    console.error("[COST PATCH ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/finance/cost?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { error, status, session } = await requireAccess();
    if (error || !session) return NextResponse.json({ error }, { status });

    const sp = request.nextUrl.searchParams;
    const id = sp.get("id");
    if (!id) return NextResponse.json({ error: "ID pengeluaran diperlukan." }, { status: 400 });

    const oldCost = await prisma.cost.findUnique({
      where: { id },
      include: {
        jurnalUmum: { where: { deletedAt: null }, take: 1 },
      },
    });

    if (!oldCost) return NextResponse.json({ error: "Data pengeluaran tidak ditemukan." }, { status: 404 });

    const oldJurnal = oldCost.jurnalUmum[0];
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      if (oldJurnal) {
        // 1. Soft Delete Jurnal Lama
        await tx.jurnalUmum.update({
          where: { id: oldJurnal.id },
          data: { deletedAt: now },
        });

        // 2. Buat Jurnal Pembalik
        await createJurnalDoubleEntry({
          ref: `REV-${oldJurnal.ref}`,
          tanggal: now,
          keterangan: `Reversal (Delete) untuk: ${oldJurnal.keterangan}`,
          akunDebetId: oldJurnal.akunKreditId,
          akunKreditId: oldJurnal.akunDebetId,
          nominal: Number(oldJurnal.nominal),
          costId: id,
          createdById: session.user.id,
          deletedAt: now,
        }, tx as any);
      }

      // 3. Hapus Data Cost (Fisik atau bisa soft-delete jika ada fieldnya)
      // Karena costId di JurnalUmum adalah onDelete: SetNull, 
      // jurnal akan tetap ada di DB dengan costId = null. Audit trail aman.
      await tx.cost.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Pengeluaran dihapus dan jurnal dibalik (reversal)." });
  } catch (err) {
    console.error("[COST DELETE ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
