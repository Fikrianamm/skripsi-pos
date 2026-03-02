import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

async function requireAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized.", status: 401, session: null };
  if (session.user.role !== "admin" && session.user.role !== "kasir")
    return { error: "Forbidden.", status: 403, session: null };
  return { error: null, status: 200, session };
}

// GET /api/order/[id]/spk — Ambil SPK order ini
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const { id } = await params;

    const spk = await prisma.sPK.findUnique({
      where: { orderId: id },
      include: {
        karyawan: { select: { id: true, nama: true, posisi: true } },
      },
    });

    return NextResponse.json({ spk });
  } catch (err) {
    console.error("[SPK GET ERROR]", err);
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}

// POST /api/order/[id]/spk — Buat SPK + update status JAHIT (atomic)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const { id: orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, statusProduksi: true },
    });

    if (!order)
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 },
      );

    const existing = await prisma.sPK.findUnique({ where: { orderId } });
    if (existing)
      return NextResponse.json(
        { error: "SPK untuk pesanan ini sudah ada." },
        { status: 400 },
      );

    const body = await req.json();
    const { karyawanId, model, tali, ukuran, jumlah, tanggalSetor, catatan } =
      body;

    if (!karyawanId)
      return NextResponse.json(
        { error: "Karyawan wajib dipilih.", field: "karyawanId" },
        { status: 400 },
      );
    if (!jumlah || isNaN(Number(jumlah)))
      return NextResponse.json(
        { error: "Jumlah wajib diisi.", field: "jumlah" },
        { status: 400 },
      );

    const karyawan = await prisma.karyawan.findUnique({
      where: { id: karyawanId },
    });
    if (!karyawan)
      return NextResponse.json(
        { error: "Karyawan tidak ditemukan." },
        { status: 404 },
      );

    // Atomic: buat SPK + update status order ke JAHIT
    const [spk] = await prisma.$transaction([
      prisma.sPK.create({
        data: {
          id: crypto.randomUUID(),
          orderId,
          karyawanId,
          tahapProduksi: "JAHIT",
          model: model?.trim() || null,
          tali: tali?.trim() || null,
          ukuran: ukuran?.trim() || null,
          jumlah: Number(jumlah),
          tanggalSetor: tanggalSetor ? new Date(tanggalSetor) : null,
          catatan: catatan?.trim() || null,
          statusSPK: "AKTIF",
        },
        include: {
          karyawan: { select: { id: true, nama: true, posisi: true } },
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { statusProduksi: "JAHIT" },
      }),
    ]);

    return NextResponse.json(
      { message: "SPK berhasil dibuat dan status diperbarui ke JAHIT.", spk },
      { status: 201 },
    );
  } catch (err) {
    console.error("[SPK POST ERROR]", err);
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}

// PUT /api/order/[id]/spk — Update detail SPK
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const { id: orderId } = await params;

    const existing = await prisma.sPK.findUnique({ where: { orderId } });
    if (!existing)
      return NextResponse.json(
        { error: "SPK tidak ditemukan." },
        { status: 404 },
      );

    const body = await req.json();
    const { karyawanId, model, tali, ukuran, jumlah, tanggalSetor, catatan } =
      body;

    if (karyawanId) {
      const karyawan = await prisma.karyawan.findUnique({
        where: { id: karyawanId },
      });
      if (!karyawan)
        return NextResponse.json(
          { error: "Karyawan tidak ditemukan." },
          { status: 404 },
        );
    }

    const updated = await prisma.sPK.update({
      where: { orderId },
      data: {
        ...(karyawanId && { karyawanId }),
        model: model !== undefined ? model?.trim() || null : existing.model,
        tali: tali !== undefined ? tali?.trim() || null : existing.tali,
        ukuran: ukuran !== undefined ? ukuran?.trim() || null : existing.ukuran,
        jumlah: jumlah !== undefined ? Number(jumlah) : existing.jumlah,
        tanggalSetor:
          tanggalSetor !== undefined
            ? tanggalSetor
              ? new Date(tanggalSetor)
              : null
            : existing.tanggalSetor,
        catatan:
          catatan !== undefined ? catatan?.trim() || null : existing.catatan,
      },
      include: {
        karyawan: { select: { id: true, nama: true, posisi: true } },
      },
    });

    return NextResponse.json({
      message: "SPK berhasil diperbarui.",
      spk: updated,
    });
  } catch (err) {
    console.error("[SPK PUT ERROR]", err);
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}

// PATCH /api/order/[id]/spk — Toggle accCetak
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const { id: orderId } = await params;
    const body = await req.json();
    const { accCetak } = body;

    const existing = await prisma.sPK.findUnique({ where: { orderId } });
    if (!existing)
      return NextResponse.json(
        { error: "SPK tidak ditemukan." },
        { status: 404 },
      );

    const session = await auth.api.getSession({ headers: await headers() });
    const updated = await prisma.sPK.update({
      where: { orderId },
      data: {
        accCetak: Boolean(accCetak),
        accCetakAt: accCetak ? new Date() : null,
        accCetakOleh: accCetak ? session?.user?.name || null : null,
      },
    });

    return NextResponse.json({
      message: "ACC Cetak diperbarui.",
      spk: updated,
    });
  } catch (err) {
    console.error("[SPK PATCH ERROR]", err);
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}
