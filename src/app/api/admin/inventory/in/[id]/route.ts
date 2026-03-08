import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (session.user.role !== "admin")
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const { id } = await params;

    const penerimaan = await prisma.penerimaanBarang.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, nama: true } },
        addedBy: { select: { id: true, name: true } },
        items: {
          include: {
            bahanBaku: {
              select: {
                id: true,
                nama: true,
                unit: { select: { nama: true } },
              },
            },
          },
        },
      },
    });

    if (!penerimaan) {
      return NextResponse.json(
        { error: "Penerimaan barang tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json(penerimaan);
  } catch (error) {
    console.error("[GET PENERIMAAN BARANG DETAIL ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
