/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Removed generated import

async function requireAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return { error: "Unauthorized", status: 401, session: null };
  if (session.user.role !== "admin")
    return { error: "Forbidden", status: 403, session: null };
  return { error: null, status: 200, session };
}

// GET /api/finance/akun
export async function GET(request: NextRequest) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const search = request.nextUrl.searchParams.get("search") || "";
    const kelompok = request.nextUrl.searchParams.get("kelompok") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { kodeAkun: { contains: search } },
        { namaAkun: { contains: search } },
      ];
    }
    if (kelompok) {
      where.kelompok = kelompok;
    }

    const akuns = await prisma.akun.findMany({
      where,
      orderBy: { kodeAkun: "asc" },
    });
    return NextResponse.json({ akuns });
  } catch (err) {
    console.error("[GET_AKUN_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/finance/akun
export async function POST(request: NextRequest) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const body = await request.json();
    const { id, kodeAkun, namaAkun, kelompok, posisiNormal, createKasBank } = body;

    let finalKodeAkun = kodeAkun;

    if (!finalKodeAkun) {
      const KELOMPOK_PREFIX: Record<string, string> = {
        AKTIVA_LANCAR: "1-",
        KEWAJIBAN: "2-",
        MODAL: "3-",
        PENDAPATAN: "4-",
        BEBAN_USAHA: "5-",
      };
      const prefix = KELOMPOK_PREFIX[kelompok] || "1-";
      
      const lastAkun = await prisma.akun.findFirst({
        where: { kodeAkun: { startsWith: prefix } },
        orderBy: { kodeAkun: "desc" }
      });

      if (lastAkun) {
        const parts = lastAkun.kodeAkun.split("-");
        const nextNum = parseInt(parts[1] || "0", 10) + 1;
        finalKodeAkun = `${prefix}${String(nextNum).padStart(3, "0")}`;
      } else {
        finalKodeAkun = `${prefix}001`;
      }
    }

    if (!id || !finalKodeAkun || !namaAkun || !kelompok || !posisiNormal) {
      return NextResponse.json({ error: "Kolom wajib belum lengkap." }, { status: 400 });
    }

    const exists = await prisma.akun.findUnique({ where: { kodeAkun: finalKodeAkun } });
    if (exists) {
        return NextResponse.json({ error: "Kode Akun sudah digunakan." }, { status: 400 });
    }

    const newAkun = await prisma.$transaction(async (tx) => {
      const akun = await tx.akun.create({
        data: {
          id,
          kodeAkun: finalKodeAkun,
          namaAkun,
          kelompok: kelompok as any,
          posisiNormal: posisiNormal as any,
        },
      });

      if (createKasBank) {
        await tx.kasBank.create({
          data: {
            id: `kb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            namaRekening: namaAkun,
            jenisRekening: "BANK",
            akunId: akun.id,
          }
        });
      }
      return akun;
    });

    return NextResponse.json({ message: "Akun berhasil ditambahkan.", akun: newAkun }, { status: 201 });
  } catch (err) {
    console.error("[POST_AKUN_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/finance/akun
export async function PATCH(request: NextRequest) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const body = await request.json();
    const { id, kodeAkun, namaAkun, kelompok, posisiNormal, isActive } = body;

    if (!id) {
        return NextResponse.json({ error: "ID wajib disertakan." }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (kodeAkun) updateData.kodeAkun = kodeAkun;
    if (namaAkun) updateData.namaAkun = namaAkun;
    if (kelompok) updateData.kelompok = kelompok as any;
    if (posisiNormal) updateData.posisiNormal = posisiNormal as any;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedAkun = await prisma.$transaction(async (tx) => {
      const akun = await tx.akun.update({
        where: { id },
        data: updateData,
      });

      if (namaAkun) {
        // Sinkronisasi nama rekening pada KasBank terkait
        await tx.kasBank.updateMany({
          where: { akunId: id },
          data: { namaRekening: namaAkun }
        });
      }

      return akun;
    });

    return NextResponse.json({ message: "Akun berhasil diupdate.", akun: updatedAkun }, { status: 200 });
  } catch (err) {
    console.error("[PATCH_AKUN_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
