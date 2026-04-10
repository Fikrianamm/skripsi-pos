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
