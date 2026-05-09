/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";

// ─── Utilities ───────────────────────────────────────────────
const getRandomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt  = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Safe day range: May only goes to 10, other months up to 28
const safeDayMax = (month: number) => (month === 5 ? 10 : 28);

export async function seedTransactions() {
  console.log("🌱 Seeding Transactions (Januari - Mei tgl 10)...");

  const year   = 2026;
  const months = [1, 2, 3, 4, 5];

  // ─── 1. Fetch master data ────────────────────────────────────
  const accounts   = await prisma.akun.findMany({ orderBy: { kodeAkun: "asc" } });
  const customers  = await prisma.customer.findMany({ where: { id: { startsWith: "cust_dummy_" } } });
  const products   = await prisma.product.findMany();
  const karyawan   = await prisma.karyawan.findMany({ where: { id: { startsWith: "kar_dummy_" } } });
  const suppliers  = await prisma.supplier.findMany({ where: { id: { startsWith: "sup_dummy_" } } });
  const bahanBaku  = await prisma.bahanBaku.findMany({ where: { id: { startsWith: "bb_dummy_" } } });
  const kasBank    = await prisma.kasBank.findFirst({ where: { id: "kb_1" } }); // Kas Bank (1-001)
  const kasCash    = await prisma.kasBank.findFirst({ where: { id: "kb_2" } }); // Uang Cash (1-002)
  const appSettings = await prisma.appSetting.findUnique({ where: { id: 1 } });

  if (!accounts.length || !customers.length || !products.length || !karyawan.length || !kasBank) {
    console.error("❌ Pre-requisite data missing. Please seed Finance, Products, and Dummy Master first.");
    return;
  }

  // ─── Helper: find account by kodeAkun ───────────────────────
  const akun = (kode: string) => {
    const found = accounts.find(a => a.kodeAkun === kode);
    if (!found) throw new Error(`Akun ${kode} tidak ditemukan!`);
    return found;
  };

  // Account references
  const aKasBank           = akun("1-001");
  const aUangCash          = akun("1-002");
  const aPiutangUsaha      = akun("1-003");
  const aTabunganKas       = akun("1-004");
  const aTabunganPembangunan = akun("1-005");
  const aTabunganSDM       = akun("1-006");
  const aTabunganTHR       = akun("1-007");
  const aTabunganCSR       = akun("1-008");
  const aTabunganPiknik    = akun("1-009");
  const aTabunganMesin     = akun("1-010");
  const aHutangUsaha       = akun("2-001");
  const aModalAwal         = akun("3-001");
  const aPrive             = akun("3-002");
  const aPendapatanKonveksi  = accounts.find(a => a.id === (appSettings?.defaultPendapatanAkunId ?? "akun_4001")) ?? akun("4-001");
  const aPendapatanPrinting  = akun("4-002");
  const aPendapatanTextile   = akun("4-003");
  const aBebanAccounts     = accounts.filter(a => a.kodeAkun.startsWith("5-"));

  const adminUser = await prisma.user.findFirst({ where: { role: "admin" } });

  // ─── JANUARI ONLY: Jurnal Pembukaan Modal Awal ──────────────
  const jurnalModalId = `jurnal_modal_awal_${year}`;
  const existingModal = await prisma.jurnalUmum.findUnique({ where: { id: jurnalModalId } });
  if (!existingModal) {
    await prisma.jurnalUmum.create({
      data: {
        id: jurnalModalId,
        ref: `MODAL-${year}-001`,
        tanggal: new Date(year, 0, 1, 8, 0, 0),
        keterangan: "Setoran Modal Awal Pemilik - Pembukaan Tahun 2026",
        namaBiaya: "Modal Awal Pemilik",
        akunDebetId: aKasBank.id,
        akunKreditId: aModalAwal.id,
        nominal: 50_000_000,
        createdById: adminUser?.id,
      },
    });
    console.log("  ✅ Jurnal Modal Awal seeded.");
  }

  // ─── Per-month loop ──────────────────────────────────────────
  for (const month of months) {
    const dayMax    = safeDayMax(month);
    const monthName = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date(year, month - 1));
    console.log(`⏳ Seeding ${monthName} (1–${dayMax})...`);

    // Guard: skip if 15 orders already seeded for this month
    const orderCount = await prisma.order.count({
      where: { nomorOrder: { startsWith: `DUMMY-ORD-${year}-${String(month).padStart(2, "0")}-` } },
    });
    if (orderCount >= 15) {
      console.log(`  ⏭️ ${monthName} transactions already seeded, skipping...`);
      continue;
    }

    // ── A. Penerimaan Barang — Hutang Usaha (Awal Bulan) ──────
    //    Kredit: Hutang Usaha (2-001), Debet: sudah masuk stok → tidak ada akun aktiva khusus
    //    Ketika bayar ke supplier → Debet Hutang Usaha, Kredit Kas Bank
    const penerimaanId = `penerimaan_dummy_${year}_${month}`;
    const tanggalBeli  = new Date(year, month - 1, 1, 9, 0, 0);
    const totalBeli    = 5_000_000;

    const existingPenerimaan = await prisma.penerimaanBarang.findUnique({ where: { id: penerimaanId } });
    if (!existingPenerimaan) {
      await prisma.penerimaanBarang.create({
        data: {
          id: penerimaanId,
          nomorFaktur: `FAK-${year}${String(month).padStart(2, "0")}-001`,
          supplierId: getRandomItem(suppliers).id,
          tanggal: tanggalBeli,
          keterangan: `Pembelian stok awal bulan ${monthName}`,
          totalTagihan: totalBeli,
          addedById: adminUser?.id,
          items: {
            create: bahanBaku.slice(0, 10).map(bb => ({
              id: `stok_masuk_${bb.id}_${month}`,
              bahanBakuId: bb.id,
              jumlah: 1000,
              hargaBeli: 500,
              totalHargaItem: 500_000,
            })),
          },
        },
      });
      // Update stok
      await Promise.all(
        bahanBaku.slice(0, 10).map(bb =>
          prisma.bahanBaku.update({ where: { id: bb.id }, data: { stok: { increment: 1000 } } })
        )
      );
    }

    // Jurnal: Beli Bahan Baku (HPP/Persediaan) – Hutang ke Supplier
    const jurnalBeliId = `jurnal_beli_${year}_${month}`;
    const existingJurnalBeli = await prisma.jurnalUmum.findUnique({ where: { id: jurnalBeliId } });
    if (!existingJurnalBeli) {
      await prisma.jurnalUmum.create({
        data: {
          id: jurnalBeliId,
          ref: `BELI-${year}${String(month).padStart(2, "0")}-001`,
          tanggal: tanggalBeli,
          keterangan: `Pembelian bahan baku ${monthName} – hutang ke supplier`,
          namaBiaya: "Pembelian Bahan Baku",
          akunDebetId: aBebanAccounts.find(a => a.kodeAkun === "5-001")!.id, // B. HPP
          akunKreditId: aHutangUsaha.id, // 2-001 Hutang Usaha
          nominal: totalBeli,
          penerimaanId: penerimaanId,
          createdById: adminUser?.id,
        },
      });
    }

    // Jurnal: Pelunasan Hutang ke Supplier (tgl 5 setiap bulan)
    const jurnalLunasHutangId = `jurnal_lunas_hutang_${year}_${month}`;
    const tanggalLunas = new Date(year, month - 1, Math.min(5, dayMax), 10, 0, 0);
    const existingLunasHutang = await prisma.jurnalUmum.findUnique({ where: { id: jurnalLunasHutangId } });
    if (!existingLunasHutang) {
      await prisma.jurnalUmum.create({
        data: {
          id: jurnalLunasHutangId,
          ref: `LUNAS-HUT-${year}${String(month).padStart(2, "0")}-001`,
          tanggal: tanggalLunas,
          keterangan: `Pelunasan hutang pembelian bahan baku ${monthName} ke supplier`,
          namaBiaya: "Pelunasan Hutang Supplier",
          akunDebetId: aHutangUsaha.id,   // 2-001 Hutang Usaha
          akunKreditId: aKasBank.id,       // 1-001 Kas Bank
          nominal: totalBeli,
          createdById: adminUser?.id,
        },
      });
    }

    // ── B. Transfer Alokasi ke Tabungan (per bulan) ────────────
    //    Kas Bank → masing-masing tabungan
    const tabungans = [
      { akun: aTabunganKas,         nominal: 1_000_000, label: "Tabungan Kas" },
      { akun: aTabunganPembangunan, nominal: 500_000,   label: "Tabungan Alokasi Pembangunan" },
      { akun: aTabunganSDM,         nominal: 300_000,   label: "Tabungan Pengembangan SDM" },
      { akun: aTabunganTHR,         nominal: 500_000,   label: "Tabungan THR" },
      { akun: aTabunganCSR,         nominal: 200_000,   label: "Tabungan CSR" },
      { akun: aTabunganPiknik,      nominal: 200_000,   label: "Tabungan Piknik" },
      { akun: aTabunganMesin,       nominal: 300_000,   label: "Tabungan Perawatan Mesin" },
    ];
    for (const t of tabungans) {
      const jId = `jurnal_tabungan_${t.akun.kodeAkun.replace("-", "")}_${year}_${month}`;
      const existing = await prisma.jurnalUmum.findUnique({ where: { id: jId } });
      if (!existing) {
        await prisma.jurnalUmum.create({
          data: {
            id: jId,
            ref: `TAB-${t.akun.kodeAkun}-${year}${String(month).padStart(2, "0")}`,
            tanggal: new Date(year, month - 1, Math.min(3, dayMax), 11, 0, 0),
            keterangan: `Alokasi ke ${t.label} bulan ${monthName}`,
            namaBiaya: `Alokasi ${t.label}`,
            akunDebetId: t.akun.id,    // Tabungan (1-00x)
            akunKreditId: aKasBank.id, // 1-001 Kas Bank
            nominal: t.nominal,
            createdById: adminUser?.id,
          },
        });
      }
    }

    // ── C. Transfer Kas Bank → Uang Cash (untuk kebutuhan harian) ─
    const jurnalCashId = `jurnal_transfer_cash_${year}_${month}`;
    const existingCash = await prisma.jurnalUmum.findUnique({ where: { id: jurnalCashId } });
    if (!existingCash) {
      await prisma.jurnalUmum.create({
        data: {
          id: jurnalCashId,
          ref: `CASH-${year}${String(month).padStart(2, "0")}-001`,
          tanggal: new Date(year, month - 1, Math.min(2, dayMax), 8, 30, 0),
          keterangan: `Transfer kas bank ke uang cash operasional ${monthName}`,
          namaBiaya: "Transfer ke Uang Cash",
          akunDebetId: aUangCash.id, // 1-002 Uang Cash
          akunKreditId: aKasBank.id, // 1-001 Kas Bank
          nominal: 2_000_000,
          createdById: adminUser?.id,
        },
      });
    }

    // ── D. Prive — Penarikan Oleh Pemilik ─────────────────────
    const jurnalPriveId = `jurnal_prive_${year}_${month}`;
    const existingPrive = await prisma.jurnalUmum.findUnique({ where: { id: jurnalPriveId } });
    if (!existingPrive) {
      await prisma.jurnalUmum.create({
        data: {
          id: jurnalPriveId,
          ref: `PRIVE-${year}${String(month).padStart(2, "0")}-001`,
          tanggal: new Date(year, month - 1, Math.min(dayMax, 28), 14, 0, 0),
          keterangan: `Penarikan prive pemilik bulan ${monthName}`,
          namaBiaya: "Prive Pemilik",
          akunDebetId: aPrive.id,    // 3-002 Prive
          akunKreditId: aKasBank.id, // 1-001 Kas Bank
          nominal: getRandomInt(2_000_000, 5_000_000),
          createdById: adminUser?.id,
        },
      });
    }

    // ── E. Beban Operasional — Semua Akun 5-xxx (nominal realistis) ──
    //
    // Tabel: { kode, nominalBase, variansi, harianKe, viaKas, hanyaBulan? }
    //   - nominalBase  : angka pokok yang masuk akal untuk bisnis konveksi UKM
    //   - variansi     : ±persen variasi antar bulan agar tidak flat
    //   - harianKe     : tanggal pencatatan (tgl tertentu setiap bulan)
    //   - viaKas       : true = bayar lewat Uang Cash (1-002), false = via Kas Bank (1-001)
    //   - hanyaBulan   : kalau diisi, hanya muncul di bulan-bulan ini (tidak rutin)
    //
    type BebanConfig = {
      kode: string;
      base: number;
      varPct: number;
      hari: number;
      viaKas: boolean;
      hanyaBulan?: number[];
      tabunganAkunId?: string; // jika diisi, biaya diambil dari akun tabungan ini
    };

    const bebanConfig: BebanConfig[] = [
      // 5-001 HPP → sudah dicatat di jurnal pembelian, skip
      { kode: "5-002", base: 8_500_000,  varPct: 10, hari: 25, viaKas: false }, // Gaji Borongan — dari Kas Bank
      { kode: "5-003", base: 1_200_000,  varPct: 15, hari: 5,  viaKas: false }, // Iklan Marketplace
      { kode: "5-004", base: 800_000,    varPct: 20, hari: 5,  viaKas: false }, // Iklan ADS
      { kode: "5-005", base: 15_000_000, varPct: 5,  hari: 25, viaKas: false }, // Gaji Semua Karyawan
      { kode: "5-006", base: 5_000_000,  varPct: 5,  hari: 25, viaKas: false }, // Gaji CEO
      { kode: "5-007", base: 1_500_000,  varPct: 10, hari: 25, viaKas: false }, // Gaji Magang/PKL
      // THR → hanya bulan Maret, DIBAYAR dari Tabungan THR (1-007)
      { kode: "5-008", base: 12_000_000, varPct: 3,  hari: 5,  viaKas: false, hanyaBulan: [3], tabunganAkunId: aTabunganTHR.id },
      // Pengembangan SDM → dibayar dari Tabungan SDM (1-006)
      { kode: "5-023", base: 2_500_000,  varPct: 10, hari: 15, viaKas: false, hanyaBulan: [1, 3], tabunganAkunId: aTabunganSDM.id },
      // CSR → rutin tiap bulan, dibayar dari Tabungan CSR (1-008)
      { kode: "5-009", base: 500_000,    varPct: 20, hari: 20, viaKas: false, tabunganAkunId: aTabunganCSR.id },
      { kode: "5-010", base: 350_000,    varPct: 10, hari: 10, viaKas: false }, // Kuota Data
      { kode: "5-011", base: 450_000,    varPct: 25, hari: 8,  viaKas: true  }, // ATK — cash
      { kode: "5-012", base: 350_000,    varPct: 5,  hari: 1,  viaKas: false }, // Internet/Wifi
      { kode: "5-013", base: 1_200_000,  varPct: 10, hari: 10, viaKas: false }, // PDAM + Listrik
      { kode: "5-014", base: 750_000,    varPct: 20, hari: 15, viaKas: true  }, // Konsumsi/Catering
      { kode: "5-015", base: 200_000,    varPct: 15, hari: 7,  viaKas: true  }, // Kebersihan/Sampah
      { kode: "5-016", base: 600_000,    varPct: 20, hari: 20, viaKas: true  }, // BBM Operasional
      { kode: "5-017", base: 250_000,    varPct: 30, hari: 12, viaKas: true  }, // Obat-obatan — rutin tiap bulan
      { kode: "5-018", base: 800_000,    varPct: 30, hari: 18, viaKas: false, hanyaBulan: [1, 3, 5] }, // Service mesin
      // Gathering/Piknik → dibayar dari Tabungan Piknik (1-009)
      { kode: "5-019", base: 3_500_000,  varPct: 15, hari: 20, viaKas: false, hanyaBulan: [2, 4], tabunganAkunId: aTabunganPiknik.id },
      { kode: "5-020", base: 500_000,    varPct: 5,  hari: 1,  viaKas: false }, // Langganan Tools
      { kode: "5-021", base: 1_800_000,  varPct: 25, hari: 22, viaKas: false }, // Kirim Manual
      { kode: "5-022", base: 25_000,     varPct: 5,  hari: 1,  viaKas: false }, // Admin Bank
      { kode: "5-024", base: 400_000,    varPct: 40, hari: 14, viaKas: true  }, // Kado — rutin, cash
      // Pembangunan → dibayar dari Tabungan Pembangunan (1-005)
      { kode: "5-025", base: 4_000_000,  varPct: 20, hari: 10, viaKas: false, hanyaBulan: [1, 2], tabunganAkunId: aTabunganPembangunan.id },
    ];

    for (const cfg of bebanConfig) {
      // Skip jika akun ini tidak muncul di bulan ini
      if (cfg.hanyaBulan && !cfg.hanyaBulan.includes(month)) continue;

      const bebanAkun = aBebanAccounts.find(a => a.kodeAkun === cfg.kode);
      if (!bebanAkun) continue; // akun tidak ada di DB, lewati

      // Variasi ±varPct% dari base agar tiap bulan tidak identik
      const varMult   = 1 + (Math.random() * 2 - 1) * (cfg.varPct / 100);
      const nominal   = Math.round(cfg.base * varMult / 1000) * 1000; // bulatkan ke ribuan
      const hariBatas = Math.min(cfg.hari, dayMax);
      const tanggalCost = new Date(year, month - 1, hariBatas, getRandomInt(8, 16), 0, 0);
      const jurnalId  = `jurnal_cost_${year}_${month}_${cfg.kode.replace("-", "")}`;

      // Tentukan akun kredit:
      // - Jika ada tabunganAkunId → bayar dari tabungan tersebut
      // - Jika viaKas → bayar dari Uang Cash (1-002)
      // - Default → Kas Bank (1-001)
      const kreditAkunId = cfg.tabunganAkunId ?? (cfg.viaKas ? aUangCash.id : aKasBank.id);

      const existing = await prisma.jurnalUmum.findUnique({ where: { id: jurnalId } });
      if (!existing) {
        await prisma.jurnalUmum.create({
          data: {
            id: jurnalId,
            ref: `COST-${year}${String(month).padStart(2, "0")}-${cfg.kode}`,
            tanggal: tanggalCost,
            keterangan: `${bebanAkun.namaAkun} ${monthName}`,
            namaBiaya: `Biaya ${bebanAkun.namaAkun}`,
            akunDebetId: bebanAkun.id,
            akunKreditId: kreditAkunId,
            nominal,
            createdById: adminUser?.id,
          },
        });
      }
    }

    // ── F. Pendapatan Lain (Printing & Textile) ────────────────
    // Nominal realistis: Printing lebih ramai, Textile sedikit lebih besar per transaksi
    const pendapatanLain = [
      {
        akun: aPendapatanPrinting,
        label: "R Printing",
        ref: "RPR",
        baseNominal: 4_500_000,   // rata-rata order printing per bulan
        varPct: 20,
      },
      {
        akun: aPendapatanTextile,
        label: "Textile",
        ref: "TXT",
        baseNominal: 7_000_000,   // textile unit lebih besar
        varPct: 25,
      },
    ];
    for (const p of pendapatanLain) {
      const jId = `jurnal_pend_${p.ref.toLowerCase()}_${year}_${month}`;
      const existing = await prisma.jurnalUmum.findUnique({ where: { id: jId } });
      if (!existing) {
        const varMult = 1 + (Math.random() * 2 - 1) * (p.varPct / 100);
        const nominal = Math.round(p.baseNominal * varMult / 500) * 500;
        await prisma.jurnalUmum.create({
          data: {
            id: jId,
            ref: `${p.ref}-${year}${String(month).padStart(2, "0")}-001`,
            tanggal: new Date(year, month - 1, getRandomInt(5, dayMax), 9, 0, 0),
            keterangan: `Pendapatan ${p.label} bulan ${monthName}`,
            namaBiaya: `Pendapatan ${p.label}`,
            akunDebetId: aKasBank.id,
            akunKreditId: p.akun.id,
            nominal,
            createdById: adminUser?.id,
          },
        });
      }
    }

    // ── G. Pesanan (15 per bulan, Mei maks tgl 10) ────────────
    for (let i = 1; i <= 15; i++) {
      const isCompleted = month < 5; // Jan–Apr selesai, Mei masih berjalan
      const orderId    = `order_dummy_${year}_${month}_${i}`;
      const nomorOrder = `DUMMY-ORD-${year}-${String(month).padStart(2, "0")}-${String(i).padStart(3, "0")}`;

      // Randomize tanggal sesuai batas hari
      const tanggalOrder = new Date(
        year, month - 1,
        getRandomInt(1, dayMax),
        getRandomInt(8, 17), getRandomInt(0, 59), 0
      );

      const selectedProducts = [
        getRandomItem(products), getRandomItem(products), getRandomItem(products),
      ];
      const itemsData = selectedProducts.map((p, idx) => {
        const qty = getRandomInt(50, 500);
        return {
          id: `item_${orderId}_${idx}`,
          productId: p.id,
          nama: p.nama,
          harga: p.hargaJual,
          qty,
          subtotal: Number(p.hargaJual) * qty,
        };
      });

      const grandTotal = itemsData.reduce((s, item) => s + item.subtotal, 0);

      // Acak channel & metode pembayaran
      const channels: any[] = ["LANGSUNG", "WHATSAPP", "INSTAGRAM", "MARKETPLACE"];
      const metodes: any[]  = ["TUNAI", "TRANSFER", "QRIS"];

      const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
      if (!existingOrder) {
        await prisma.order.create({
          data: {
            id: orderId,
            nomorOrder,
            customerId: getRandomItem(customers).id,
            userId: adminUser?.id,
            channel: getRandomItem(channels),
            statusProduksi: isCompleted
              ? "SELESAI"
              : getRandomItem(["PENDING", "DESAIN", "PRODUKSI", "PACKING"]),
            statusPembayaran: isCompleted ? "LUNAS" : getRandomItem(["BELUM_BAYAR", "DP"]),
            metodePembayaran: getRandomItem(metodes),
            subtotal: grandTotal,
            grandTotal,
            createdAt: tanggalOrder,
            items: { create: itemsData },
            spk: {
              create: {
                id: `spk_${orderId}`,
                nomorSpk: `DUMMY-SPK-${year}-${month}-${i}`,
                karyawanId: getRandomItem(karyawan).id,
                tahapProduksi: isCompleted ? "SELESAI" : "PRODUKSI",
                jumlah: getRandomInt(10, 100),
                statusSPK: isCompleted ? "SELESAI" : "AKTIF",
                createdAt: tanggalOrder,
                // DesignFile dikosongkan sesuai permintaan
                pengeluaran: {
                  create: {
                    id: `keluar_dummy_${orderId}`,
                    tanggal: tanggalOrder,
                    keterangan: `Bahan baku untuk ${nomorOrder}`,
                    addedById: adminUser?.id,
                    items: {
                      create: bahanBaku.slice(0, 3).map(bb => ({
                        id: `stok_keluar_${orderId}_${bb.id}`,
                        bahanBakuId: bb.id,
                        jumlah: 5,
                      })),
                    },
                  },
                },
              },
            },
          },
        });

        // Kurangi stok bahan baku
        await Promise.all(
          bahanBaku.slice(0, 3).map(bb =>
            prisma.bahanBaku.update({ where: { id: bb.id }, data: { stok: { decrement: 5 } } })
          )
        );
      }

      // ── H. Payment & Jurnal Pendapatan (order lunas) ────────
      if (isCompleted) {
        const paymentId = `pay_dummy_${orderId}`;
        const existingPayment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!existingPayment) {
          await prisma.payment.create({
            data: {
              id: paymentId,
              orderId,
              userId: adminUser?.id,
              nominal: grandTotal,
              tanggal: tanggalOrder,
              jurnalUmum: {
                create: {
                  id: `jurnal_pay_${paymentId}`,
                  ref: `PAY-${year}${String(month).padStart(2, "0")}-${String(i).padStart(3, "0")}`,
                  tanggal: tanggalOrder,
                  keterangan: `Pembayaran Order ${nomorOrder}`,
                  namaBiaya: `Pendapatan Order ${nomorOrder}`,
                  akunDebetId: aKasBank.id,             // 1-001 Kas Bank
                  akunKreditId: aPendapatanKonveksi.id, // 4-001 Pendapatan Konveksi
                  nominal: grandTotal,
                  createdById: adminUser?.id,
                },
              },
            },
          });
        }
      } else {
        // ── I. Piutang — Order Belum Lunas (DP atau Belum Bayar) ─
        //    Debet: Piutang Usaha (1-003), Kredit: Pendapatan (4-001)
        const jurnalPiutangId = `jurnal_piutang_${orderId}`;
        const existingPiutang = await prisma.jurnalUmum.findUnique({ where: { id: jurnalPiutangId } });
        if (!existingPiutang) {
          // DP: catat sebagian kas masuk dulu, sisanya piutang
          const dpNominal      = Math.floor(grandTotal * 0.5);
          const piutangNominal = grandTotal - dpNominal;

          // Jurnal DP masuk (kas)
          if (dpNominal > 0) {
            await prisma.jurnalUmum.create({
              data: {
                id: `jurnal_dp_${orderId}`,
                ref: `DP-${year}${String(month).padStart(2, "0")}-${String(i).padStart(3, "0")}`,
                tanggal: tanggalOrder,
                keterangan: `DP Order ${nomorOrder} (50%)`,
                namaBiaya: `DP Order ${nomorOrder}`,
                akunDebetId: aKasBank.id,
                akunKreditId: aPendapatanKonveksi.id,
                nominal: dpNominal,
                createdById: adminUser?.id,
              },
            });
          }

          // Jurnal piutang sisa
          await prisma.jurnalUmum.create({
            data: {
              id: jurnalPiutangId,
              ref: `PIU-${year}${String(month).padStart(2, "0")}-${String(i).padStart(3, "0")}`,
              tanggal: tanggalOrder,
              keterangan: `Piutang sisa Order ${nomorOrder} (belum lunas)`,
              namaBiaya: `Piutang Order ${nomorOrder}`,
              akunDebetId: aPiutangUsaha.id,        // 1-003 Piutang Usaha
              akunKreditId: aPendapatanKonveksi.id, // 4-001 Pendapatan Konveksi
              nominal: piutangNominal,
              createdById: adminUser?.id,
            },
          });
        }
      }
    }

    console.log(`  ✅ ${monthName} seeded (orders, jurnal, tabungan, beban, piutang).`);
  }

  // ──────────────────────────────────────────────────────────────
  // PATCH: Pastikan 9 akun ini ada nominalnya di SEMUA bulan
  //        (menggunakan upsert agar data lama pun ikut diperbaiki)
  // ──────────────────────────────────────────────────────────────
  console.log("🔧 Patching missing/incorrect beban entries for all months...");

  type PatchCfg = { kode: string; base: number; varPct: number; hari: number; viaKas: boolean; tabunganAkunId?: string; hanyaBulan?: number[] };
  const patchList: PatchCfg[] = [
    { kode: "5-003", base: 1_200_000,  varPct: 15, hari: 5,  viaKas: false }, // Iklan Marketplace — rutin
    { kode: "5-004", base: 800_000,    varPct: 20, hari: 5,  viaKas: false }, // Iklan ADS — rutin
    { kode: "5-009", base: 500_000,    varPct: 20, hari: 20, viaKas: false, tabunganAkunId: aTabunganCSR.id },   // CSR dari Tabungan CSR
    { kode: "5-011", base: 450_000,    varPct: 25, hari: 8,  viaKas: true  }, // ATK/Perlengkapan — cash
    { kode: "5-012", base: 350_000,    varPct: 5,  hari: 1,  viaKas: false }, // Internet/Wifi — rutin
    { kode: "5-015", base: 200_000,    varPct: 15, hari: 7,  viaKas: true  }, // Kebersihan/Sampah — cash
    { kode: "5-017", base: 250_000,    varPct: 30, hari: 12, viaKas: true  }, // Obat-obatan — rutin, cash
    { kode: "5-019", base: 3_500_000,  varPct: 15, hari: 20, viaKas: false, tabunganAkunId: aTabunganPiknik.id, hanyaBulan: [2, 4] }, // Gathering dari Tabungan Piknik (Feb & Apr)
    { kode: "5-024", base: 400_000,    varPct: 40, hari: 14, viaKas: true  }, // Kado — rutin, cash
  ];

  // Referensi akun untuk patch
  const kasBankForPatch = kasBank; // 1-001
  const kasCashForPatch = kasCash; // 1-002

  for (const cfg of patchList) {
    const bebanAkun = accounts.find(a => a.kodeAkun === cfg.kode);
    if (!bebanAkun) {
      console.warn(`  ⚠️ Akun ${cfg.kode} tidak ditemukan di DB, skip.`);
      continue;
    }

    for (const month of months) {
      // Lewati bulan yang tidak masuk hanyaBulan (jika didefinisikan)
      if (cfg.hanyaBulan && !cfg.hanyaBulan.includes(month)) continue;

      const dayMax    = safeDayMax(month);
      const monthName = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date(year, month - 1));
      const hariBatas = Math.min(cfg.hari, dayMax);
      const tanggal   = new Date(year, month - 1, hariBatas, getRandomInt(8, 16), 0, 0);

      // Nominal: ±varPct% dari base, dibulatkan ke ribuan
      const varMult = 1 + (Math.random() * 2 - 1) * (cfg.varPct / 100);
      const nominal = Math.round(cfg.base * varMult / 1000) * 1000;

      const jurnalId     = `jurnal_cost_${year}_${month}_${cfg.kode.replace("-", "")}`;
      // Tentukan sumber pembayaran: tabungan khusus > uang cash > kas bank
      const kreditAkunId = cfg.tabunganAkunId
        ?? (cfg.viaKas ? kasCashForPatch!.akunId! : kasBankForPatch!.akunId!);

      await prisma.jurnalUmum.upsert({
        where: { id: jurnalId },
        update: {
          // Perbarui nominal & keterangan jika record sudah ada
          nominal,
          keterangan: `${bebanAkun.namaAkun} ${monthName}`,
          namaBiaya: `Biaya ${bebanAkun.namaAkun}`,
          akunKreditId: kreditAkunId,
        },
        create: {
          id: jurnalId,
          ref: `COST-${year}${String(month).padStart(2, "0")}-${cfg.kode}`,
          tanggal,
          keterangan: `${bebanAkun.namaAkun} ${monthName}`,
          namaBiaya: `Biaya ${bebanAkun.namaAkun}`,
          akunDebetId: bebanAkun.id,
          akunKreditId: kreditAkunId,
          nominal,
          createdById: adminUser?.id,
        },
      });
    }

    console.log(`  ✅ Patch selesai: ${bebanAkun.namaAkun} (${bebanAkun.kodeAkun}) — 5 bulan`);
  }

  console.log("✅ Transactions Seeding completed!");
}
