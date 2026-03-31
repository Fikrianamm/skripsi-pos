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
export async function GET() {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const akuns = await prisma.akun.findMany({
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
    const { id, kodeAkun, namaAkun, kelompok, posisiNormal, isActive } = body;

    if (!id || !kodeAkun || !namaAkun || !kelompok || !posisiNormal) {
      return NextResponse.json({ error: "Kolom wajib belum lengkap." }, { status: 400 });
    }

    const exists = await prisma.akun.findUnique({ where: { kodeAkun } });
    if (exists) {
        return NextResponse.json({ error: "Kode Akun sudah digunakan." }, { status: 400 });
    }

    const newAkun = await prisma.akun.create({
      data: {
        id,
        kodeAkun,
        namaAkun,
        kelompok: kelompok as any,
        posisiNormal: posisiNormal as any,
        isActive: isActive ?? true,
      },
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

    const updatedAkun = await prisma.akun.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: "Akun berhasil diupdate.", akun: updatedAkun }, { status: 200 });
  } catch (err) {
    console.error("[PATCH_AKUN_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
