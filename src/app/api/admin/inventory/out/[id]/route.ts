import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── GET /api/admin/inventory/out/[id] — Detail satu pengeluaran
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

    const pengeluaran = await prisma.pengeluaranBarang.findUnique({
      where: { id },
      include: {
        addedBy: { select: { name: true, image: true, role: true } },
        spk: {
          select: {
            id: true,
            orderId: true,
            order: {
              select: {
                nomorOrder: true,
                customer: { select: { nama: true, image: true } },
              },
            },
          },
        },
        items: {
          select: {
            id: true,
            jumlah: true,
            bahanBaku: {
              select: { nama: true, unit: { select: { nama: true } } },
            },
          },
        },
      },
    });

    if (!pengeluaran)
      return NextResponse.json(
        { error: "Data tidak ditemukan." },
        { status: 404 },
      );

    return NextResponse.json(pengeluaran);
  } catch (error) {
    console.error("[GET PENGELUARAN DETAIL ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// ── DELETE /api/admin/inventory/out/[id] — Hapus + rollback stok
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

    const pengeluaran = await prisma.pengeluaranBarang.findUnique({
      where: { id },
      include: { items: { select: { bahanBakuId: true, jumlah: true } } },
    });

    if (!pengeluaran)
      return NextResponse.json(
        { error: "Data tidak ditemukan." },
        { status: 404 },
      );

    // Delete header (cascade deletes items) + rollback stock
    await prisma.$transaction([
      prisma.pengeluaranBarang.delete({ where: { id } }),
      ...pengeluaran.items.map((item) =>
        prisma.bahanBaku.update({
          where: { id: item.bahanBakuId },
          data: { stok: { increment: Number(item.jumlah) } },
        }),
      ),
    ]);

    return NextResponse.json({
      message: "Pengeluaran dihapus dan stok telah di-rollback.",
    });
  } catch (error) {
    console.error("[DELETE PENGELUARAN ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
