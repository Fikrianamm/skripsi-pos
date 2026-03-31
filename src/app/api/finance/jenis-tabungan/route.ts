import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function requireAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return { error: "Unauthorized", status: 401, session: null };
  if (session.user.role !== "admin")
    return { error: "Forbidden", status: 403, session: null };
  return { error: null, status: 200, session };
}

// GET /api/finance/jenis-tabungan
export async function GET() {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const jenisTabungans = await prisma.jenisTabungan.findMany({
      orderBy: { nama: "asc" },
      include: {
        akun: { select: { namaAkun: true, kodeAkun: true } },
      },
    });

    return NextResponse.json({ jenisTabungans });
  } catch (err) {
    console.error("[GET_JENIS_TABUNGAN_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/finance/jenis-tabungan
export async function POST(request: NextRequest) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const body = await request.json();
    const { nama, keterangan, akunId } = body;

    if (!nama || !akunId) {
      return NextResponse.json({ error: "Nama tabungan dan Akun peruntukan wajib diisi." }, { status: 400 });
    }

    const uniqueId = `TBG-CAT-${Date.now().toString().slice(-6)}`;

    const newJenis = await prisma.jenisTabungan.create({
      data: {
        id: uniqueId,
        nama,
        keterangan,
        akunId,
        isActive: true,
      },
    });

    return NextResponse.json({ message: "Kategori tabungan berhasil ditambahkan.", jenisTabungan: newJenis }, { status: 201 });
  } catch (err) {
    console.error("[POST_JENIS_TABUNGAN_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
