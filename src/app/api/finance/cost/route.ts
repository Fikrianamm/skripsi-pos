/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJurnalDoubleEntry } from "@/lib/finance";
import { createNotificationForRole } from "@/lib/notifications";
import { JenisNotif } from "../../../../../generated/prisma/enums";

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
    const page   = Number(sp.get("page")  || "1");
    const limit  = Number(sp.get("limit") || "10");
    const bulan  = sp.get("bulan") || "";
    const tahun  = sp.get("tahun") || "";

    // Build date filter
    let tanggalFilter: Record<string, Date> = {};
    if (bulan && tahun) {
      const b = parseInt(bulan);
      const y = parseInt(tahun);
      tanggalFilter = {
        gte: new Date(y, b - 1, 1),
        lte: new Date(y, b, 0, 23, 59, 59, 999),
      };
    } else if (tahun) {
      const y = parseInt(tahun);
      tanggalFilter = {
        gte: new Date(y, 0, 1),
        lte: new Date(y, 11, 31, 23, 59, 59, 999),
      };
    }

    const where = {
      deletedAt: null,
      akunDebet: {
        kelompok: "BEBAN_USAHA" as const,
        ...(akunId ? { id: akunId } : {}),
      },
      ...(Object.keys(tanggalFilter).length > 0 ? { tanggal: tanggalFilter } : {}),
      ...(search
        ? {
            OR: [
              { keterangan: { contains: search } },
              { ref: { contains: search } },
            ],
          }
        : {}),
    };

    const [jurnals, count] = await Promise.all([
      prisma.jurnalUmum.findMany({
        where,
        orderBy: { tanggal: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          akunDebet: { select: { id: true, namaAkun: true, kelompok: true } },
          akunKredit: { select: { namaAkun: true, kelompok: true } },
          createdBy: { select: { id: true, name: true, image: true } },
        },
      }),
      prisma.jurnalUmum.count({ where }),
    ]);

    // Map ke shape yang sama dengan CostData agar frontend tidak perlu diubah
    const results = jurnals.map((j) => ({
      id: j.id,
      nama: j.keterangan,
      nominal: j.nominal,
      keterangan: j.keterangan,
      tanggal: j.tanggal,
      akun: { namaAkun: j.akunDebet.namaAkun, kelompok: j.akunDebet.kelompok },
      user: j.createdBy,
      jurnalUmum: [
        {
          akunKredit: { namaAkun: j.akunKredit.namaAkun, kelompok: j.akunKredit.kelompok },
        },
      ],
    }));

    const totalPages = Math.ceil(count / limit);

    return NextResponse.json({ results, count, totalPages });
  } catch (err) {
    console.error("[COST GET ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/finance/cost
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

    const realTanggal = tanggal ? new Date(tanggal) : new Date();

    const jurnal = await prisma.$transaction(async (tx) => {
      // Create Jurnal Directly
      const newJurnal = await createJurnalDoubleEntry(
        {
          ref: `CST-${Date.now().toString().slice(-6)}`,
          tanggal: realTanggal,
          keterangan: keterangan || `Pengeluaran: ${nama}`,
          namaBiaya: nama,
          buktiNota: buktiNota || null,
          akunDebetId: akunId,
          akunKreditId: kasBank.akunId!,
          nominal: Number(nominal),
          createdById: session.user.id,
        },
        tx as any
      );

      return newJurnal;
    });

    // Notify Admins
    try {
      await createNotificationForRole(["admin", "kasir"], {
        title: "Pengeluaran Dicatat",
        message: `${nama} sebesar ${new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(nominal)} telah dicatat.`,
        jenis: JenisNotif.BIAYA_DICATAT,
        linkUrl: "/finance/biaya",
      });
    } catch (e) {
      console.error("Failed to send notification:", e);
    }

    return NextResponse.json({ message: "Pengeluaran berhasil dicatat", jurnal }, { status: 201 });
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
    const id = sp.get("id"); // ini adalah Jurnal ID
    if (!id) return NextResponse.json({ error: "ID pengeluaran diperlukan." }, { status: 400 });

    const body = await request.json();
    const { akunId, nama, nominal, keterangan, buktiNota, tanggal, kasBankId } = body;

    const oldJurnal = await prisma.jurnalUmum.findUnique({
      where: { id },
    });

    if (!oldJurnal || oldJurnal.deletedAt)
      return NextResponse.json({ error: "Data pengeluaran tidak ditemukan." }, { status: 404 });

    const kasBank = kasBankId
      ? await prisma.kasBank.findUnique({ where: { id: kasBankId }, include: { akun: true } })
      : null;

    if (kasBankId && (!kasBank || !kasBank.akunId)) {
      return NextResponse.json({ error: "Rekening Kas/Bank tidak valid." }, { status: 400 });
    }

    const realTanggal = tanggal ? new Date(tanggal) : oldJurnal.tanggal;
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Soft Delete & Reversal Jurnal Lama
      await tx.jurnalUmum.update({
        where: { id: oldJurnal.id },
        data: { deletedAt: now },
      });

      await createJurnalDoubleEntry(
        {
          ref: `REV-${oldJurnal.ref}`,
          tanggal: now,
          keterangan: `Reversal untuk: ${oldJurnal.keterangan}`,
          akunDebetId: oldJurnal.akunKreditId,
          akunKreditId: oldJurnal.akunDebetId,
          nominal: Number(oldJurnal.nominal),
          createdById: session.user.id,
          deletedAt: now,
        },
        tx as any
      );

      // 2. Buat Jurnal Baru (Benar)
      const newJurnal = await createJurnalDoubleEntry(
        {
          ref: oldJurnal.ref.startsWith("CST-") ? oldJurnal.ref : `CST-${Date.now().toString().slice(-6)}`,
          tanggal: realTanggal,
          keterangan: keterangan || `Pengeluaran (Koreksi): ${nama || oldJurnal.namaBiaya}`,
          namaBiaya: nama || oldJurnal.namaBiaya,
          buktiNota: buktiNota !== undefined ? (buktiNota || null) : oldJurnal.buktiNota,
          akunDebetId: akunId || oldJurnal.akunDebetId,
          akunKreditId: kasBank?.akunId || oldJurnal.akunKreditId,
          nominal: nominal !== undefined ? Number(nominal) : Number(oldJurnal.nominal),
          createdById: session.user.id,
        },
        tx as any
      );

      return newJurnal;
    });

    return NextResponse.json({ message: "Pengeluaran berhasil dikoreksi (reversal applied)", jurnal: result });
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
    const id = sp.get("id"); // Jurnal ID
    if (!id) return NextResponse.json({ error: "ID pengeluaran diperlukan." }, { status: 400 });

    const oldJurnal = await prisma.jurnalUmum.findUnique({
      where: { id },
    });

    if (!oldJurnal || oldJurnal.deletedAt)
      return NextResponse.json({ error: "Data pengeluaran tidak ditemukan." }, { status: 404 });

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Soft Delete Jurnal Lama
      await tx.jurnalUmum.update({
        where: { id: oldJurnal.id },
        data: { deletedAt: now },
      });

      // 2. Buat Jurnal Pembalik
      await createJurnalDoubleEntry(
        {
          ref: `REV-${oldJurnal.ref}`,
          tanggal: now,
          keterangan: `Reversal (Delete) untuk: ${oldJurnal.keterangan}`,
          akunDebetId: oldJurnal.akunKreditId,
          akunKreditId: oldJurnal.akunDebetId,
          nominal: Number(oldJurnal.nominal),
          createdById: session.user.id,
          deletedAt: now,
        },
        tx as any
      );
    });

    return NextResponse.json({ message: "Pengeluaran dipindahkan ke sampah." });
  } catch (err) {
    console.error("[COST DELETE ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
