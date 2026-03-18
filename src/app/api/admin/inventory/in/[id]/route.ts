import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToNeo } from "@/lib/storage";
import path from "path";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized.", status: 401 };
  if (session.user.role !== "admin")
    return { error: "Forbidden.", status: 403 };
  return { session };
}

// ── GET /api/admin/inventory/in/[id] ──────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth)
      return NextResponse.json({ error: auth.error }, { status: auth.status });

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

    if (!penerimaan)
      return NextResponse.json(
        { error: "Penerimaan barang tidak ditemukan." },
        { status: 404 },
      );

    return NextResponse.json(penerimaan);
  } catch (error) {
    console.error("[GET PENERIMAAN DETAIL ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// ── PATCH /api/admin/inventory/in/[id] — Update penerimaan + adjust stok ──────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult)
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );

    const { id } = await params;

    const existing = await prisma.penerimaanBarang.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Penerimaan tidak ditemukan." },
        { status: 404 },
      );

    const formData = await request.formData();
    const supplierId = formData.get("supplierId") as string | null;
    const nomorFaktur = formData.get("nomorFaktur") as string | null;
    const tanggal = formData.get("tanggal") as string | null;
    const keterangan = formData.get("keterangan") as string | null;
    const itemsRaw = formData.get("items") as string;
    const buktiNotaFile = formData.get("buktiNota") as File | null;

    let newItems: { bahanBakuId: string; jumlah: number; hargaBeli: number }[];
    try {
      newItems = JSON.parse(itemsRaw).map(
        (item: {
          bahanBakuId: string;
          jumlah: string | number;
          hargaBeli?: string | number;
        }) => ({
          bahanBakuId: item.bahanBakuId,
          jumlah: Number(item.jumlah),
          hargaBeli: Number(item.hargaBeli) || 0,
        }),
      );
    } catch {
      return NextResponse.json(
        { error: "Format barang tidak valid." },
        { status: 400 },
      );
    }

    // Upload new file if provided
    let fileUrl: string | null = existing.buktiNota;
    if (buktiNotaFile && buktiNotaFile.size > 0) {
      const ext = path.extname(buktiNotaFile.name) || "";
      const s3Key = `penerimaan/${id}/nota${ext}`;
      fileUrl = await uploadToNeo({
        key: s3Key,
        body: Buffer.from(await buktiNotaFile.arrayBuffer()),
        contentType: buktiNotaFile.type,
      });
    }

    const newTotal = newItems.reduce(
      (acc, i) => acc + i.jumlah * i.hargaBeli,
      0,
    );

    // Build transaction: rollback old stock → delete old items → create new items → update stok
    await prisma.$transaction([
      // 1. Rollback old stock
      ...existing.items.map((oldItem) =>
        prisma.bahanBaku.update({
          where: { id: oldItem.bahanBakuId },
          data: { stok: { decrement: oldItem.jumlah } },
        }),
      ),
      // 2. Delete old items
      prisma.stokMasuk.deleteMany({ where: { penerimaanId: id } }),
      // 3. Update header
      prisma.penerimaanBarang.update({
        where: { id },
        data: {
          supplierId: supplierId || null,
          nomorFaktur: nomorFaktur || null,
          tanggal: tanggal ? new Date(tanggal) : existing.tanggal,
          keterangan: keterangan || null,
          buktiNota: fileUrl,
          totalTagihan: newTotal,
        },
      }),
      // 4. Create new items
      prisma.stokMasuk.createMany({
        data: newItems.map((item) => ({
          id: crypto.randomUUID(),
          penerimaanId: id,
          bahanBakuId: item.bahanBakuId,
          jumlah: item.jumlah,
          hargaBeli: item.hargaBeli,
          totalHargaItem: item.jumlah * item.hargaBeli,
        })),
      }),
      // 5. Increment new stock
      ...newItems.map((item) =>
        prisma.bahanBaku.update({
          where: { id: item.bahanBakuId },
          data: { stok: { increment: item.jumlah } },
        }),
      ),
    ]);

    return NextResponse.json({ message: "Penerimaan berhasil diperbarui." });
  } catch (error) {
    console.error("[PATCH PENERIMAAN ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// ── DELETE /api/admin/inventory/in/[id] — Hapus + rollback stok ───────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult)
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );

    const { id } = await params;

    const existing = await prisma.penerimaanBarang.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Penerimaan tidak ditemukan." },
        { status: 404 },
      );

    await prisma.$transaction([
      // 1. Rollback stok untuk setiap item
      ...existing.items.map((item) =>
        prisma.bahanBaku.update({
          where: { id: item.bahanBakuId },
          data: { stok: { decrement: item.jumlah } },
        }),
      ),
      // 2. Hapus items
      prisma.stokMasuk.deleteMany({ where: { penerimaanId: id } }),
      // 3. Hapus header
      prisma.penerimaanBarang.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      message: "Penerimaan berhasil dihapus dan stok telah di-rollback.",
    });
  } catch (error) {
    console.error("[DELETE PENERIMAAN ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
