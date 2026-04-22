/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJurnalDoubleEntry } from "@/lib/finance";

async function requireAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized", status: 401, session: null };
  if (session.user.role !== "admin") return { error: "Forbidden", status: 403, session: null };
  return { error: null, status: 200, session };
}

// GET /api/finance/jurnal?bulan=3&tahun=2026&search=gaji
export async function GET(request: NextRequest) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const sp = request.nextUrl.searchParams;
    const now = new Date();
    const bulan = sp.get("bulan") ? parseInt(sp.get("bulan")!) : null;
    const tahun = parseInt(sp.get("tahun") || String(now.getFullYear()));
    const search = sp.get("search") || "";
    const limit = parseInt(sp.get("limit") || "500");

    const where: any = { deletedAt: null };
    if (bulan) {
      where.tanggal = {
        gte: new Date(tahun, bulan - 1, 1),
        lte: new Date(tahun, bulan, 0, 23, 59, 59, 999),
      };
    } else {
      where.tanggal = {
        gte: new Date(tahun, 0, 1),
        lte: new Date(tahun, 11, 31, 23, 59, 59, 999),
      };
    }

    if (search) {
      where.OR = [
        { keterangan: { contains: search } },
        { ref: { contains: search } },
        { akunDebet: { namaAkun: { contains: search } } },
        { akunKredit: { namaAkun: { contains: search } } },
      ];
    }

    const jurnals = await prisma.jurnalUmum.findMany({
      where,
      orderBy: { tanggal: "desc" },
      take: limit,
      select: {
        id: true,
        ref: true,
        tanggal: true,
        keterangan: true,
        nominal: true,
        akunDebetId: true,
        akunKreditId: true,
        akunDebet:  { select: { kodeAkun: true, namaAkun: true, kelompok: true } },
        akunKredit: { select: { kodeAkun: true, namaAkun: true } },
        paymentId: true,
        costId: true,
        penerimaanId: true,
        createdBy:  { select: { name: true } },
      },
    });

    const totalNominal = jurnals.reduce((s, j) => s + Number(j.nominal), 0);

    return NextResponse.json({ jurnals, totalNominal, count: jurnals.length });
  } catch (err) {
    console.error("[GET_JURNAL_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/finance/jurnal  — tambah manual ATAU buat reversal
export async function POST(request: NextRequest) {
  try {
    const { error, status, session } = await requireAccess();
    if (error || !session) return NextResponse.json({ error }, { status });

    const body = await request.json();
    const { tanggal, keterangan, akunDebetId, akunKreditId, nominal, isReversal, reversalOfRef } = body;

    if (!tanggal || !keterangan || !akunDebetId || !akunKreditId || typeof nominal !== "number" || nominal <= 0) {
      return NextResponse.json({ error: "Kolom wajib belum lengkap atau nominal tidak valid." }, { status: 400 });
    }
    if (akunDebetId === akunKreditId) {
      return NextResponse.json({ error: "Akun debet dan kredit tidak boleh sama." }, { status: 400 });
    }

    const refPrefix = isReversal ? "J-REV" : "J-MAN";
    const ref = reversalOfRef
      ? `${refPrefix}-${reversalOfRef}`
      : `${refPrefix}-${Date.now().toString().slice(-6)}`;

    const newJurnal = await createJurnalDoubleEntry({
      ref,
      tanggal: new Date(tanggal),
      keterangan,
      akunDebetId,
      akunKreditId,
      nominal,
      createdById: session.user.id,
    });

    return NextResponse.json({
      message: isReversal ? "Entri koreksi berhasil dibuat." : "Jurnal berhasil dicatat.",
      jurnal: newJurnal,
    }, { status: 201 });
  } catch (err) {
    console.error("[POST_JURNAL_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/finance/jurnal?id=xxx  — hanya MANUAL yang bisa dihapus
export async function DELETE(request: NextRequest) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    const jurnal = await prisma.jurnalUmum.findUnique({ where: { id } });
    if (!jurnal) return NextResponse.json({ error: "Jurnal tidak ditemukan" }, { status: 404 });

    // Hanya jurnal manual (tanpa relasi ke modul lain) yang bisa dihapus
    if (jurnal.paymentId || jurnal.costId || jurnal.penerimaanId) {
      return NextResponse.json({
        error: "Tidak dapat menghapus jurnal otomatis. Hapus dari modul asalnya (Payment/Cost/Penerimaan).",
      }, { status: 403 });
    }

    await prisma.jurnalUmum.delete({ where: { id } });
    return NextResponse.json({ message: "Jurnal berhasil dihapus." });
  } catch (err) {
    console.error("[DELETE_JURNAL_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
