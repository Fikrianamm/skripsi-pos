/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJurnalDoubleEntry } from "@/lib/finance";
import { createNotificationForRole } from "@/lib/notifications";
import { JenisNotif } from "../../../../generated/prisma/enums";

// Shared auth guard: admin or kasir only
async function requireOrderAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return {
      error: "Unauthorized. Silakan login terlebih dahulu.",
      status: 401,
      session: null,
    };
  const ALLOWED = ["admin", "kasir", "designer", "produksi", "gudang"];
  if (!session.user.role || !ALLOWED.includes(session.user.role)) {
    return {
      error: "Forbidden. Anda tidak memiliki akses.",
      status: 403,
      session: null,
    };
  }
  return { error: null, status: 200, session };
}

// Generate order number based on settings
async function generateNomorOrder(): Promise<string> {
  const settings = await prisma.appSetting.findUnique({ where: { id: 1 } });
  const basePrefix = settings?.prefixOrder || "ORD-";

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `${basePrefix}${dateStr}-`;

  const lastOrder = await prisma.order.findFirst({
    where: { nomorOrder: { startsWith: prefix } },
    orderBy: { nomorOrder: "desc" },
    select: { nomorOrder: true },
  });

  let seq = 1;
  if (lastOrder) {
    const parts = lastOrder.nomorOrder.split("-");
    const lastPart = parts[parts.length - 1];
    seq = parseInt(lastPart || "0", 10) + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

// ─── GET /api/order — List orders ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { error, status } = await requireOrderAccess();
    if (error) return NextResponse.json({ error }, { status });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const statusProduksi = searchParams.get("statusProduksi") || "";
    const statusPembayaran = searchParams.get("statusPembayaran") || "";
    const customerId = searchParams.get("customerId") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const statusHargaFilter = searchParams.get("statusHarga") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { nomorOrder: { contains: search } },
        { customer: { nama: { contains: search } } },
      ];
    }
    if (statusProduksi) where.statusProduksi = statusProduksi;
    if (statusPembayaran) where.statusPembayaran = statusPembayaran;
    if (customerId) where.customerId = customerId;
    if (statusHargaFilter) {
      where.items = {
        some: {
          statusHarga: statusHargaFilter,
          deletedAt: null,
        },
      };
    }

    // Sort: deadline asc nulls-last, or createdAt desc (default)
    const orderBy =
      sortBy === "deadline"
        ? [
            { deadline: { sort: "asc" as const, nulls: "last" as const } },
            { createdAt: "desc" as const },
          ]
        : [{ createdAt: "desc" as const }];

    const [results, count] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          nomorOrder: true,
          channel: true,
          statusProduksi: true,
          statusPembayaran: true,
          metodePembayaran: true,
          deadline: true,
          subtotal: true,
          diskon: true,
          ongkir: true,
          grandTotal: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: { id: true, nama: true, nomorHp: true, image: true },
          },
          _count: { select: { items: true, designFiles: true } },
          spk: { select: { id: true } },
          items: {
            select: { nama: true, qty: true, statusHarga: true },
            take: 10,
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      results,
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("[ORDER LIST ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// ─── POST /api/order — Create order ───────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { error, status, session } = await requireOrderAccess();
    if (error || !session) return NextResponse.json({ error }, { status });

    const body = await request.json();
    const {
      customerId,
      channel,
      statusPembayaran,
      metodePembayaran,
      deadline,
      catatan,
      diskon,
      ongkir,
      subtotal,
      grandTotal,
      items,
      kasBankId,
      nominalBayar,
    } = body;

    // Validasi field wajib
    if (!customerId) {
      return NextResponse.json(
        { error: "Customer wajib dipilih." },
        { status: 400 },
      );
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Pesanan harus memiliki minimal satu item." },
        { status: 400 },
      );
    }
    if (subtotal === undefined || grandTotal === undefined) {
      return NextResponse.json(
        { error: "Subtotal dan grandTotal wajib diisi." },
        { status: 400 },
      );
    }

    if (
      (statusPembayaran === "DP" || statusPembayaran === "LUNAS") &&
      (!kasBankId || !nominalBayar || Number(nominalBayar) <= 0)
    ) {
      return NextResponse.json(
        {
          error:
            "Kas/Bank tujuan dan nominal bayar wajib diisi jika status LUNAS atau DP.",
        },
        { status: 400 },
      );
    }

    // Validasi: nominal DP tidak boleh melebihi grandTotal
    if (statusPembayaran === "DP" && Number(nominalBayar) > Number(grandTotal)) {
      return NextResponse.json(
        { error: `Nominal DP (${Number(nominalBayar)}) tidak boleh melebihi Grand Total (${Number(grandTotal)}).` },
        { status: 400 },
      );
    }
    
    // Pastikan customer ada
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return NextResponse.json(
        { error: "Customer tidak ditemukan." },
        { status: 404 },
      );
    }

    // Validasi semua produk ada
    const productIds: string[] = items.map(
      (i: { productId: string }) => i.productId,
    );
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, isService: true },
    });
    if (existingProducts.length !== productIds.length) {
      return NextResponse.json(
        { error: "Satu atau lebih produk tidak ditemukan." },
        { status: 400 },
      );
    }
    const productMap = new Map(existingProducts.map((p) => [p.id, p]));

    // Validasi stok produk (Fitur #3)
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { nama: true, stok: true, isService: true },
      });
      if (product && !product.isService) {
        const currentStok = Number(product.stok || 0);
        if (currentStok < item.qty) {
          return NextResponse.json(
            {
              error: `Stok produk "${product.nama}" tidak mencukupi (sisa: ${currentStok}).`,
            },
            { status: 400 },
          );
        }
      }
    }

    const settings = await prisma.appSetting.findUnique({ where: { id: 1 } });
    const nomorOrder = await generateNomorOrder();

    // Apply default deadline if not provided
    let finalDeadline = deadline ? new Date(deadline) : null;
    if (!finalDeadline && settings?.estimasiHariPengerjaan) {
      const d = new Date();
      d.setDate(d.getDate() + settings.estimasiHariPengerjaan);
      finalDeadline = d;
    }

    const orderId = crypto.randomUUID();

    // Auto-upgrade DP ke LUNAS jika nominal bayar >= grandTotal
    let finalStatusPembayaran = statusPembayaran || "BELUM_BAYAR";
    if (finalStatusPembayaran === "DP" && Number(nominalBayar) >= Number(grandTotal)) {
      finalStatusPembayaran = "LUNAS";
    }

    const order = await prisma.$transaction(async (tx) => {
      // 1. Buat Order
      const newOrder = await tx.order.create({
        data: {
          id: orderId,
          customerId,
          nomorOrder,
          channel: channel || "LANGSUNG",
          statusProduksi: "PENDING",
          statusPembayaran: finalStatusPembayaran,
          metodePembayaran: metodePembayaran || "TUNAI",
          deadline: finalDeadline,
          catatan: catatan || null,
          diskon: diskon ?? 0,
          ongkir: ongkir ?? null,
          subtotal: subtotal,
          grandTotal: grandTotal,
          items: {
            create: items.map(
              (item: {
                productId: string;
                nama: string;
                harga?: number;
                qty: number;
                subtotal?: number;
              }) => {
                const prod = productMap.get(item.productId);
                const isService = prod?.isService ?? false;
                const statusHarga = isService ? "MENUNGGU_DESAIN" : "NA";
                const itemHarga = item.harga ? Number(item.harga) : 0;
                const itemSubtotal = item.subtotal ? Number(item.subtotal) : (itemHarga * Number(item.qty));

                return {
                  id: crypto.randomUUID(),
                  productId: item.productId,
                  nama: item.nama,
                  harga: itemHarga,
                  qty: item.qty,
                  subtotal: itemSubtotal,
                  statusHarga: statusHarga as any,
                };
              },
            ),
          },
        },
        select: {
          id: true,
          nomorOrder: true,
          channel: true,
          statusProduksi: true,
          statusPembayaran: true,
          metodePembayaran: true,
          deadline: true,
          catatan: true,
          subtotal: true,
          diskon: true,
          ongkir: true,
          grandTotal: true,
          createdAt: true,
          customer: { select: { id: true, nama: true, nomorHp: true } },
          items: {
            select: {
              id: true,
              productId: true,
              nama: true,
              harga: true,
              qty: true,
              subtotal: true,
            },
          },
        },
      });

      // 2. Jurnal Piutang Usaha saat pesanan dibuat (hanya jika nominal > 0 dan bukan custom item tanpa harga)
      //    Debet = Piutang Usaha (1-003), Kredit = Pendapatan (Default from Settings or 4-001)
      const hasCustomItems = existingProducts.some((p) => p.isService);
      const grandTotalNum = Number(grandTotal || 0);

      const piutangAkun = await tx.akun.findUnique({
        where: { kodeAkun: "1-003" },
      });
      const pendapatanAkun = settings?.defaultPendapatanAkunId
        ? await tx.akun.findUnique({
            where: { id: settings.defaultPendapatanAkunId },
          })
        : await tx.akun.findUnique({ where: { kodeAkun: "4-001" } });

      if (!hasCustomItems && grandTotalNum > 0 && piutangAkun && pendapatanAkun) {
        await createJurnalDoubleEntry(
          {
            ref: `${nomorOrder.slice(0, 10)}`, // Using order number as ref part
            tanggal: new Date(),
            keterangan: `Piutang Order #${nomorOrder} - ${customer.nama}`,
            namaBiaya: `Piutang Order #${nomorOrder}`,
            akunDebetId: piutangAkun.id,
            akunKreditId: pendapatanAkun.id,
            nominal: grandTotalNum,
            createdById: session.user.id,
          },
          tx as any,
        );
      }

      // 3. Jika user membuat pesanan + langsung bayar (DP / Lunas)
      //    Catat juga jurnal pembayaran: Debet Kas/Bank, Kredit Piutang Usaha
      if (
        (statusPembayaran === "DP" || statusPembayaran === "LUNAS") &&
        kasBankId
      ) {
        const nominal = Number(nominalBayar);
        const paymentId = crypto.randomUUID();

        await tx.payment.create({
          data: {
            id: paymentId,
            orderId: orderId,
            userId: session.user.id,
            nominal: nominal,
            metodePembayaran: metodePembayaran || "TUNAI",
            keterangan: "Pembayaran awal saat checkout POS",
          },
        });

        const kasBank = await tx.kasBank.findUnique({
          where: { id: kasBankId },
          include: { akun: true },
        });

        if (!kasBank || !kasBank.akunId) {
          throw new Error("Rekening Kas/Bank tujuan tidak valid.");
        }

        // Note: SaldoKasBank via Jurnal Umum

        // Debet = Kas/Bank, Kredit = Piutang Usaha (mengurangi piutang)
        if (piutangAkun) {
          await createJurnalDoubleEntry(
            {
              ref: `PYM-${orderId.slice(0, 5)}`,
              tanggal: new Date(),
              keterangan: `Pembayaran Awal Order #${nomorOrder}`,
              namaBiaya: `Pembayaran Awal Order #${nomorOrder}`,
              akunDebetId: kasBank.akunId!,
              akunKreditId: piutangAkun.id,
              nominal: nominal,
              paymentId: paymentId,
              createdById: session.user.id,
            },
            tx as any,
          );
        }
      }

      return newOrder;
    });

    // Notify Admins & Kasir about new order (Fitur #1)
    try {
      const notifInput = {
        title: "Pesanan Baru!",
        message: `Order #${order.nomorOrder} dari ${order.customer.nama} berhasil dibuat.`,
        jenis: JenisNotif.ORDER_BARU,
        linkUrl: `/order/${order.id}`,
      };
      await Promise.all([
        createNotificationForRole(
          ["admin", "kasir", "produksi", "designer", "gudang"],
          notifInput,
        ),
      ]);
    } catch (e) {
      console.error("Failed to send notification:", e);
    }

    return NextResponse.json(
      { message: "Pesanan berhasil dibuat.", order },
      { status: 201 },
    );
  } catch (error) {
    console.error("[ORDER CREATE ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
