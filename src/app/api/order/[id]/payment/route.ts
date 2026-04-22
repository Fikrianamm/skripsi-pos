/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJurnalDoubleEntry } from "@/lib/finance";
import { createNotificationForRole } from "@/lib/notifications";
import { JenisNotif } from "../../../../../../generated/prisma/enums";

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
        nomorOrder: true,
        customer: { select: { nama: true } },
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

    const piutangAkun = await prisma.akun.findUnique({ where: { kodeAkun: "1-003" } });
    if (!piutangAkun)
      return NextResponse.json({ error: "Akun Piutang Usaha (1-003) tidak ditemukan." }, { status: 500 });

    const sudahDibayar = order.payments.reduce(
      (s: number, p: { nominal: unknown }) => s + Number(p.nominal),
      0
    );
    const grandTotal = Number(order.grandTotal);
    const sisaTagihan = Math.max(0, grandTotal - sudahDibayar);
    const newTotal = sudahDibayar + Number(nominal);

    // Guard: tolak jika nominal melebihi sisa tagihan
    if (Number(nominal) > sisaTagihan) {
      return NextResponse.json(
        {
          error: `Nominal pembayaran (${Number(nominal).toLocaleString("id-ID")}) melebihi sisa tagihan (${sisaTagihan.toLocaleString("id-ID")}). Silakan sesuaikan nominal.`,
        },
        { status: 400 },
      );
    }

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

      // 3. (Dihapus) Tidak perlu update saldo KasBank manual, karena diambil otomatis dari JurnalUmum

      // 4. Merekam Jurnal UMUM (Double-Entry)
      //    Debet = Akun Kas/Bank, Kredit = Akun Pendapatan
      await createJurnalDoubleEntry({
        ref: `PYM-${id.slice(0, 5)}`,
        tanggal: realTanggal,
        keterangan: `Pembayaran Order #${id.slice(0, 8)} - ${keterangan || "Tanpa Keterangan"}`,
        akunDebetId: kasBank.akunId!,
        akunKreditId: piutangAkun.id,
        nominal: Number(nominal),
        paymentId: paymentId,
        createdById: session.user.id,
      }, tx as any);

      return [p];
    });

    // Notify Admins about new payment (Fitur #1)
    try {
      await createNotificationForRole("admin", {
        title: "Pembayaran Diterima",
        message: `Pembayaran sebesar ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(nominal)} diterima untuk Order #${order.nomorOrder} (${order.customer.nama}).`,
        jenis: JenisNotif.PAYMENT_MASUK,
        linkUrl: `/order/${order.id}`,
      });
    } catch (e) {
      console.error("Failed to send notification:", e);
    }

    return NextResponse.json(
      { message: "Pembayaran berhasil dicatat.", payment, statusPembayaran: newStatus },
      { status: 201 }
    );
  } catch (err) {
    console.error("[PAYMENT CREATE ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


// PATCH /api/order/[id]/payment — correct a payment
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { error, status, session } = await requireOrderAccess();
    if (error || !session) return NextResponse.json({ error }, { status });

    const { id: orderId } = await params;
    const sp = request.nextUrl.searchParams;
    const paymentId = sp.get("paymentId");
    if (!paymentId) return NextResponse.json({ error: "paymentId diperlukan." }, { status: 400 });

    const body = await request.json();
    const { nominal, metodePembayaran, keterangan, tanggal, kasBankId } = body;

    const oldPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        jurnalUmum: { where: { deletedAt: null }, take: 1 },
      },
    });

    if (!oldPayment || oldPayment.orderId !== orderId) {
      return NextResponse.json({ error: "Pembayaran tidak ditemukan." }, { status: 404 });
    }

    const oldJurnal = oldPayment.jurnalUmum[0];

    const kasBank = kasBankId
      ? await prisma.kasBank.findUnique({ where: { id: kasBankId }, include: { akun: true } })
      : null;

    if (kasBankId && (!kasBank || !kasBank.akunId)) {
      return NextResponse.json({ error: "Rekening Kas/Bank tidak valid." }, { status: 400 });
    }

    const piutangAkun = await prisma.akun.findUnique({ where: { kodeAkun: "1-003" } });
    const realTanggal = tanggal ? new Date(tanggal) : oldPayment.tanggal;
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Soft Delete & Reversal Jurnal Lama (Hanya jika masih ada)
      if (oldJurnal) {
        await tx.jurnalUmum.update({
          where: { id: oldJurnal.id },
          data: { deletedAt: now },
        });

        await createJurnalDoubleEntry({
          ref: `REV-${oldJurnal.ref}`,
          tanggal: now,
          keterangan: `Reversal untuk: ${oldJurnal.keterangan}`,
          akunDebetId: oldJurnal.akunKreditId,
          akunKreditId: oldJurnal.akunDebetId,
          nominal: Number(oldJurnal.nominal),
          paymentId: paymentId,
          createdById: session.user.id,
          deletedAt: now,
        }, tx as any);
      }

      // 3. Update Data Payment
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          nominal: nominal !== undefined ? Number(nominal) : oldPayment.nominal,
          metodePembayaran: metodePembayaran || oldPayment.metodePembayaran,
          keterangan: keterangan !== undefined ? (keterangan || null) : oldPayment.keterangan,
          tanggal: realTanggal,
        },
      });

      // 4. Buat Jurnal Baru (Benar)
      await createJurnalDoubleEntry({
        ref: `PYM-${orderId.slice(0, 5)}`,
        tanggal: realTanggal,
        keterangan: `Pembayaran Order #${orderId.slice(0, 8)} (Koreksi) - ${updatedPayment.keterangan || ""}`,
        akunDebetId: kasBank?.akunId || (oldJurnal ? oldJurnal.akunDebetId : ""), // Fallback empty string will fail validation if both null, but usually kasBank is provided or oldJurnal exists
        akunKreditId: piutangAkun?.id || (oldJurnal ? oldJurnal.akunKreditId : ""),
        nominal: Number(updatedPayment.nominal),
        paymentId: paymentId,
        createdById: session.user.id,
      }, tx as any);

      // 5. Recalculate Order Status
      const remaining = await tx.payment.aggregate({
        _sum: { nominal: true },
        where: { orderId },
      });
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { grandTotal: true },
      });
      const paid = Number(remaining._sum.nominal ?? 0);
      const grand = Number(order?.grandTotal ?? 0);
      const newStatus: "BELUM_BAYAR" | "DP" | "LUNAS" =
        paid >= grand ? "LUNAS" : paid > 0 ? "DP" : "BELUM_BAYAR";
      await tx.order.update({ where: { id: orderId }, data: { statusPembayaran: newStatus } });

      return { payment: updatedPayment, statusPembayaran: newStatus };
    });

    return NextResponse.json({ message: "Pembayaran berhasil dikoreksi (reversal applied)", ...result });
  } catch (err) {
    console.error("[PAYMENT PATCH ERROR]", err);
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
      include: {
        jurnalUmum: { where: { deletedAt: null }, take: 1 },
      },
    });

    if (!payment || payment.orderId !== orderId)
      return NextResponse.json({ error: "Pembayaran tidak ditemukan." }, { status: 404 });

    const oldJurnal = payment.jurnalUmum[0];
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      if (oldJurnal) {
        // 1. Soft Delete Jurnal Lama
        await tx.jurnalUmum.update({
          where: { id: oldJurnal.id },
          data: { deletedAt: now },
        });

        // 2. Buat Jurnal Pembalik
        await createJurnalDoubleEntry({
          ref: `REV-${oldJurnal.ref}`,
          tanggal: now,
          keterangan: `Reversal (Delete) untuk: ${oldJurnal.keterangan}`,
          akunDebetId: oldJurnal.akunKreditId,
          akunKreditId: oldJurnal.akunDebetId,
          nominal: Number(oldJurnal.nominal),
          paymentId: paymentId,
          createdById: session.user.id,
          deletedAt: now,
        }, tx as any);
      }

      // 3. Hapus Data Payment
      await tx.payment.delete({ where: { id: paymentId } });

      // 4. Recalculate status
      const remaining = await tx.payment.aggregate({
        _sum: { nominal: true },
        where: { orderId },
      });
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { grandTotal: true },
      });
      const paid = Number(remaining._sum.nominal ?? 0);
      const grand = Number(order?.grandTotal ?? 0);
      const newStatus: "BELUM_BAYAR" | "DP" | "LUNAS" =
        paid >= grand ? "LUNAS" : paid > 0 ? "DP" : "BELUM_BAYAR";
      await tx.order.update({ where: { id: orderId }, data: { statusPembayaran: newStatus } });
    });

    return NextResponse.json({ message: "Pembayaran dihapus (reversal applied)." });
  } catch (err) {
    console.error("[PAYMENT DELETE ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
