import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/inventory/opname/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (session.user.role !== "admin")
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const { id } = await params;
    const opname = await prisma.stokOpname.findUnique({
      where: { id },
      include: {
        addedBy: { select: { name: true, image: true, role: true } },
        items: {
          select: {
            id: true,
            stokSistem: true,
            stokFisik: true,
            selisih: true,
            bahanBaku: {
              select: { nama: true, unit: { select: { nama: true } } },
            },
          },
        },
      },
    });

    if (!opname || opname.deletedAt)
      return NextResponse.json(
        { error: "Data tidak ditemukan atau sudah dihapus." },
        { status: 404 },
      );

    return NextResponse.json(opname);
  } catch (error) {
    console.error("[GET STOK OPNAME DETAIL ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/inventory/opname/[id] — hapus + rollback stok ke stokSistem
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (session.user.role !== "admin")
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const { id } = await params;
    const opname = await prisma.stokOpname.findUnique({
      where: { id },
      include: {
        items: { select: { bahanBakuId: true, stokSistem: true } },
      },
    });

    if (!opname || opname.deletedAt)
      return NextResponse.json(
        { error: "Data tidak ditemukan atau sudah dihapus." },
        { status: 404 },
      );

    // Delete header (cascade deletes items) + rollback stock to stokSistem
    await prisma.$transaction([
      prisma.stokOpname.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      ...opname.items.map((item) =>
        prisma.bahanBaku.update({
          where: { id: item.bahanBakuId },
          data: { stok: Number(item.stokSistem) },
        }),
      ),
    ]);

    return NextResponse.json({
      message: "Stok opname dipindahkan ke sampah.",
    });
  } catch (error) {
    console.error("[DELETE STOK OPNAME ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
