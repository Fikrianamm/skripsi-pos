import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJurnalDoubleEntry } from "@/lib/finance";

type Params = { params: Promise<{ id: string }> };

async function requireOrderAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return { error: "Unauthorized", status: 401, session: null };
  if (session.user.role !== "admin" && session.user.role !== "kasir")
    return { error: "Forbidden", status: 403, session: null };
  return { error: null, status: 200, session };
}

// GET /api/order/[id]/payment — list payments for an order
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { error, status } = await requireOrderAccess();
    if (error) return NextResponse.json({ error }, { status });

    const { id } = await params;
    const payments = await prisma.payment.findMany({
      where: { orderId: id },
      orderBy: { tanggal: "desc" },
      select: {
        id: true,
        nominal: true,
        metodePembayaran: true,
        keterangan: true,
        tanggal: true,
        user: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ payments });
  } catch (err) {
    console.error("[PAYMENT LIST ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/order/[id]/payment — record a new payment for an order
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { error, status, session } = await requireOrderAccess();
    if (error || !session) return NextResponse.json({ error }, { status });

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        grandTotal: true,
        statusPembayaran: true,
        payments: { select: { nominal: true } },
      },
    });
    if (!order)
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });

    const body = await request.json();
    const { nominal, metodePembayaran, keterangan, tanggal, kasBankId } = body;

    if (!nominal || nominal <= 0)
      return NextResponse.json({ error: "Nominal harus lebih dari 0." }, { status: 400 });

    if (!kasBankId)
      return NextResponse.json({ error: "Kas/Bank tujuan (kasBankId) tidak boleh kosong." }, { status: 400 });

    const kasBank = await prisma.kasBank.findUnique({
      where: { id: kasBankId },
      include: { akun: true },
    });
    if (!kasBank || !kasBank.akunId)
      return NextResponse.json({ error: "Rekening Kas/Bank tidak ditemukan atau akunId tidak di set." }, { status: 400 });

    const pendapatanKasirAkun = await prisma.akun.findUnique({ where: { kodeAkun: "4-001" } });
    if (!pendapatanKasirAkun)
      return NextResponse.json({ error: "Akun Pendapatan Penjualan (4-001) tidak ditemukan." }, { status: 500 });

    const sudahDibayar = order.payments.reduce(
      (s: number, p: { nominal: unknown }) => s + Number(p.nominal),
      0
    );
    const grandTotal = Number(order.grandTotal);
    const newTotal = sudahDibayar + Number(nominal);

    // Determine new statusPembayaran
    let newStatus: "BELUM_BAYAR" | "DP" | "LUNAS" = "BELUM_BAYAR";
    if (newTotal >= grandTotal) newStatus = "LUNAS";
    else if (newTotal > 0) newStatus = "DP";

    const paymentId = crypto.randomUUID();
    const realTanggal = tanggal ? new Date(tanggal) : new Date();

    const [payment] = await prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const p = await tx.payment.create({
        data: {
          id: paymentId,
          orderId: id,
          userId: session.user.id,
          nominal: Number(nominal),
          metodePembayaran: metodePembayaran || "TUNAI",
          keterangan: keterangan || null,
          tanggal: realTanggal,
        },
      });

      // 2. Update Order Status
      await tx.order.update({
        where: { id },
        data: { statusPembayaran: newStatus },
      });

      // 3. Update KasBank Balance
      await tx.kasBank.update({
        where: { id: kasBankId },
        data: { saldoSaatIni: { increment: Number(nominal) } },
      });

      // 4. Merekam Jurnal UMUM (Double-Entry)
      //    Debet = Akun Kas/Bank, Kredit = Akun Pendapatan
      await createJurnalDoubleEntry({
        ref: `PYM-${id.slice(0, 5)}`,
        tanggal: realTanggal,
        keterangan: `Pembayaran Order #${id.slice(0, 8)} - ${keterangan || "Tanpa Keterangan"}`,
        akunDebetId: kasBank.akunId!,
        akunKreditId: pendapatanKasirAkun.id,
        nominal: Number(nominal),
        sumber: "PAYMENT" as any,
        divisi: "HQ" as any, // pukul rata masuk divisi HQ sesuai konfirmasi user
        paymentId: paymentId,
        createdById: session.user.id,
      }, tx as any);

      return [p];
    });

    return NextResponse.json(
      { message: "Pembayaran berhasil dicatat.", payment, statusPembayaran: newStatus },
      { status: 201 }
    );
  } catch (err) {
    console.error("[PAYMENT CREATE ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/order/[id]/payment — delete a payment (admin only)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { error, status, session } = await requireOrderAccess();
    if (error || !session) return NextResponse.json({ error }, { status });

    if (session.user.role !== "admin")
      return NextResponse.json({ error: "Hanya admin yang dapat menghapus pembayaran." }, { status: 403 });

    const { id: orderId } = await params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");
    if (!paymentId)
      return NextResponse.json({ error: "paymentId diperlukan." }, { status: 400 });

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, orderId: true },
    });
    if (!payment || payment.orderId !== orderId)
      return NextResponse.json({ error: "Pembayaran tidak ditemukan." }, { status: 404 });

    await prisma.payment.delete({ where: { id: paymentId } });

    // Recalculate status
    const remaining = await prisma.payment.aggregate({
      _sum: { nominal: true },
      where: { orderId },
    });
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { grandTotal: true },
    });
    const paid = Number(remaining._sum.nominal ?? 0);
    const grand = Number(order?.grandTotal ?? 0);
    const newStatus: "BELUM_BAYAR" | "DP" | "LUNAS" =
      paid >= grand ? "LUNAS" : paid > 0 ? "DP" : "BELUM_BAYAR";
    await prisma.order.update({ where: { id: orderId }, data: { statusPembayaran: newStatus } });

    return NextResponse.json({ message: "Pembayaran dihapus." });
  } catch (err) {
    console.error("[PAYMENT DELETE ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
