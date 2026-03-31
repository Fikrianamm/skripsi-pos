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
  if (session.user.role !== "admin")
    return { error: "Forbidden", status: 403, session: null };
  return { error: null, status: 200, session };
}

// GET /api/finance/jurnal
export async function GET(request: NextRequest) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "100");

    const jurnals = await prisma.jurnalUmum.findMany({
      orderBy: { tanggal: "desc" },
      take: limit,
      include: {
        akunDebet: { select: { kodeAkun: true, namaAkun: true } },
        akunKredit: { select: { kodeAkun: true, namaAkun: true } },
        createdBy: { select: { name: true } },
      },
    });

    return NextResponse.json({ jurnals });
  } catch (err) {
    console.error("[GET_JURNAL_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/finance/jurnal
export async function POST(request: NextRequest) {
  try {
    const { error, status, session } = await requireAccess();
    if (error || !session) return NextResponse.json({ error }, { status });

    const body = await request.json();
    const { tanggal, keterangan, akunDebetId, akunKreditId, nominal } = body;

    if (!tanggal || !keterangan || !akunDebetId || !akunKreditId || typeof nominal !== "number" || nominal <= 0) {
      return NextResponse.json({ error: "Kolom wajib belum lengkap atau nominal tidak valid." }, { status: 400 });
    }
    if (akunDebetId === akunKreditId) {
      return NextResponse.json({ error: "Akun debet dan kredit tidak boleh sama." }, { status: 400 });
    }

    const uniqueId = `J-MAN-${Date.now().toString().slice(-6)}`;
    
    // Gunakan utility yang sudah ada, default ke MANUAL
    const newJurnal = await createJurnalDoubleEntry({
      ref: uniqueId,
      tanggal: new Date(tanggal),
      keterangan,
      akunDebetId,
      akunKreditId,
      nominal,
      sumber: "MANUAL" as any, 
      createdById: session.user.id,
    });

    return NextResponse.json({ message: "Jurnal berhasil dicatat.", jurnal: newJurnal }, { status: 201 });
  } catch (err) {
    console.error("[POST_JURNAL_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
