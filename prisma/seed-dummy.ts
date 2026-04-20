/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";

// Utilities
const generateRandomId = (prefix: string) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
const getRandomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Variatif Data Dictionaries
const firstNames = ["Budi", "Siti", "Andi", "Rini", "Ahmad", "Dewi", "Eko", "Maya", "Joko", "Putri", "Rizky", "Mega", "Hendra", "Dina", "Agus", "Lina", "Reza", "Ayu", "Fajar", "Tari", "Rio", "Nia", "Ari", "Sari"];
const lastNames = ["Santoso", "Wijaya", "Kusuma", "Setiawan", "Pratama", "Lestari", "Nugroho", "Sari", "Hidayat", "Saputra", "Wulandari", "Maulana", "Sanjaya", "Permana", "Mulyadi", "Gunawan", "Rahma", "Putra"];
const cities = ["Jakarta", "Bandung", "Surabaya", "Semarang", "Yogyakarta", "Medan", "Makassar", "Bali", "Malang", "Solo", "Bogor", "Depok", "Tangerang", "Bekasi", "Denpasar", "Palembang", "Pekanbaru"];
const materials = ["Kain Blacu", "Kain Canvas", "Kain Spunbond", "Benang Jahit", "Tinta Sablon", "Tali Kur", "Kancing Besi", "Plastik Mika", "Resleting Daun", "Resleting Kepala", "Tali Bisban", "Kain Drill"];
const suppliersPrefix = ["PT", "CV", "Toko", "Grosir", "Pabrik", "UD", "Distributor", "Koperasi"];
const positions = ["Desainer", "Tukang Jahit", "Tukang Sablon", "Tukang Potong", "Admin Gudang"];
const orderCatatan = ["Tolong dikirim secepatnya", "Packing yang rapi", "Sablon diperjelas", "Tanpa catatan", "", "Dropship", "Custom sablon 2 sisi", "Tag label jangan lupa", "Resleting warna putih"];
const designFiles = ["logo_perusahaan.png", "desain_kaos.ai", "mockup_tas_v2.pdf", "sketsa_sablon.jpg", "referensi_warna.jpg", "logo_revisi_final.psd"];

export async function seedDummy() {
  console.log("🌱 Menambahkan SUPER MASSIVE Dummy Data dengan Variasi Tingkat Tinggi...");

  // 1. Seed Karyawan (20 records)
  console.log("⏳ Seeding 20 Karyawan...");
  const karyawanData = [];
  for (let i = 1; i <= 20; i++) {
    karyawanData.push({
      id: `kar_dummy_${i}`,
      nama: `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`,
      nomorHp: `081${getRandomInt(100000000, 999999999)}`,
      posisi: getRandomItem(positions),
      isActive: Math.random() > 0.1, // 90% aktif
    });
  }
  await prisma.karyawan.createMany({ data: karyawanData, skipDuplicates: true });

  // 2. Seed Customer (100 records)
  console.log("⏳ Seeding 100 Customers...");
  const customerData = [];
  for (let i = 1; i <= 100; i++) {
    customerData.push({
      id: `cust_dummy_${i}`,
      nama: `${getRandomItem(firstNames)} ${getRandomItem(lastNames)} (Cust ${i})`,
      nomorHp: `085${getRandomInt(100000000, 999999999)}`,
    });
  }
  await prisma.customer.createMany({ data: customerData, skipDuplicates: true });

  // 3. Seed Supplier (50 records)
  console.log("⏳ Seeding 50 Suppliers...");
  const supplierData = [];
  for (let i = 1; i <= 50; i++) {
    supplierData.push({
      id: `sup_dummy_${i}`,
      nama: `${getRandomItem(suppliersPrefix)} ${getRandomItem(lastNames)} ${getRandomItem(cities)}`,
      nomorHp: `021${getRandomInt(1000000, 9999999)}`,
      alamat: `Kawasan Industri ${getRandomItem(cities)} Blok ${getRandomItem(["A", "B", "C", "D"])}${getRandomInt(1, 20)}`,
      keterangan: `Supplier ${getRandomItem(materials)} Utama`,
    });
  }
  await prisma.supplier.createMany({ data: supplierData, skipDuplicates: true });

  // 4. Seed Bahan Baku (100 records)
  console.log("⏳ Seeding 100 Bahan Baku... (Dan mengatur stok berjalan)");
  const bahanBakuData = [];
  for (let i = 1; i <= 100; i++) {
    const mat = getRandomItem(materials);
    bahanBakuData.push({
      id: `bb_dummy_${i}`,
      nama: `${mat} Grade ${getRandomItem(["A", "B", "C", "Super", "Premium"])} - ${i}`,
      unitId: "unit_pcs",
      stok: getRandomInt(50, 5000), // Diperbanyak
      minStok: getRandomInt(20, 100),
      keterangan: `Bahan baku standar produksi konveksi`,
    });
  }
  await prisma.bahanBaku.createMany({ data: bahanBakuData, skipDuplicates: true });

  // PREPARE SHARED DATA FOR TRANSACTIONS
  const adminId = "QW8sCq9NcZ0aXaag9SWAJRnGfgKFHxMB";
  const defaultProduct = await prisma.product.findFirst();
  const baseDate = new Date("2024-10-01"); // Tarik agak jauh biar banyak laporan bulanannya
  const endDate = new Date();

  // // 5. Seed Penerimaan Barang / Inbound (150 records)
  // console.log("⏳ Seeding 150 Penerimaan Barang (Inbound)...");
  // for (let i = 1; i <= 150; i++) {
  //     const inboundId = `in_dummy_${i}`;
  //     const existIn = await prisma.penerimaanBarang.findUnique({ where: { id: inboundId } });
  //     if (existIn) continue;

  //     const inDate = getRandomDate(baseDate, endDate);
  //     const bbId = `bb_dummy_${getRandomInt(1, 100)}`;
  //     const qty = getRandomInt(100, 1000);
  //     const harga = getRandomInt(2, 50) * 1000;

  //     await prisma.penerimaanBarang.create({
  //        data: {
  //           id: inboundId,
  //           nomorFaktur: `INV-S-${Math.random().toString(36).substring(2,6).toUpperCase()}`,
  //           tanggal: inDate,
  //           supplierId: `sup_dummy_${getRandomInt(1, 50)}`,
  //           keterangan: `Restock Surat Jalan SJ-${getRandomInt(1000,9999)}`,
  //           addedById: adminId,
  //           totalTagihan: qty * harga,
  //           items: {
  //              create: [
  //                 {
  //                    id: generateRandomId("stok_masuk"),
  //                    bahanBakuId: bbId,
  //                    jumlah: qty,
  //                    hargaBeli: harga,
  //                    totalHargaItem: qty * harga
  //                 }
  //              ]
  //           }
  //        }
  //     });
  // }

  // // 6. Seed Stok Opname (20 records)
  // console.log("⏳ Seeding 20 Stok Opname (Audit/Koreksi Gudang)...");
  // for (let i = 1; i <= 20; i++) {
  //     const opnameId = `opn_dummy_${i}`;
  //     const existOp = await prisma.stokOpname.findUnique({ where: { id: opnameId } });
  //     if (existOp) continue;

  //     const opDate = getRandomDate(baseDate, endDate);
  //     const bbId = `bb_dummy_${getRandomInt(1, 100)}`;
  //     const sistemQty = getRandomInt(500, 1000);
  //     const fisikQty = sistemQty - getRandomInt(-20, 50); // Bisa selisih kurang atau lebih

  //     await prisma.stokOpname.create({
  //         data: {
  //             id: opnameId,
  //             tanggal: opDate,
  //             keterangan: `Audit Bulanan Gudang - Batch ${i}`,
  //             addedById: adminId,
  //             items: {
  //                 create: [
  //                     {
  //                         id: generateRandomId("so_item"),
  //                         bahanBakuId: bbId,
  //                         stokSistem: sistemQty,
  //                         stokFisik: fisikQty,
  //                         selisih: fisikQty - sistemQty
  //                     }
  //                 ]
  //             }
  //         }
  //     });
  // }

  // if (defaultProduct) {
  //   // 7. Seed Orders, SPK, PengeluaranBarang, DesignFile, Jurnals (300 records)
  //   console.log("⏳ Seeding 300 Kompleks Transaksi (Order -> Desain -> SPK -> Barang Keluar -> Jurnal)...");
  //   for (let i = 1; i <= 300; i++) {
  //       const orderId = `ord_dummy_${i}`;
  //       const orderDate = getRandomDate(baseDate, endDate);
        
  //       // Lewati jika sudah dibuat
  //       const existOrder = await prisma.order.findUnique({ where: { id: orderId } });
  //       if (existOrder) continue;

  //       // Varian Harga dan Status
  //       const totalQty = getRandomInt(10, 500);
  //       const hargaSatuan = getRandomItem([8000, 10000, 12000, 15000, 20000, 25000]);
  //       const orderTotal = totalQty * hargaSatuan;
        
  //       const isPaid = Math.random() > 0.3; // 70% lunas
  //       let paymentAmount = isPaid ? orderTotal : getRandomInt(100000, orderTotal - 10000); // Setidaknya bayar DP
  //       if (!isPaid && Math.random() > 0.8) paymentAmount = 0; // 20% dari belum lunas benar-benar 0 (Belum Bayar)

  //       const order = await prisma.order.create({
  //         data: {
  //           id: orderId,
  //           nomorOrder: `ORD-${Math.random().toString(36).substring(2,6).toUpperCase()}-${i.toString().padStart(4, '0')}`,
  //           customerId: `cust_dummy_${getRandomInt(1, 100)}`,
  //           userId: adminId,
  //           createdAt: orderDate,
  //           channel: getRandomItem(["LANGSUNG", "WHATSAPP", "INSTAGRAM", "MARKETPLACE", "WEBSITE"]),
  //           statusProduksi: isPaid ? getRandomItem(["SELESAI", "PACKING"]) : getRandomItem(["PRODUKSI", "DESAIN", "PENDING"]),
  //           statusPembayaran: isPaid ? "LUNAS" : (paymentAmount > 0 ? "DP" : "BELUM_BAYAR"),
  //           subtotal: orderTotal,
  //           diskon: Math.random() > 0.8 ? getRandomInt(1, 5) * 10000 : 0, // Ada diskon acak
  //           ongkir: Math.random() > 0.5 ? getRandomInt(1, 10) * 5000 : 0,
  //           grandTotal: orderTotal, // Simplified, asumsikan kotor tanpa hitung diskon real
  //           catatan: getRandomItem(orderCatatan),
  //           metodePembayaran: getRandomItem(["TUNAI", "TRANSFER"] as any),
  //           items: {
  //             create: [
  //               {
  //                 id: generateRandomId("item"),
  //                 productId: defaultProduct.id,
  //                 nama: defaultProduct.nama,
  //                 qty: totalQty,
  //                 harga: hargaSatuan,
  //                 subtotal: orderTotal,
  //               }
  //             ]
  //           }
  //         }
  //       });

  //       // 7a. BANK DESAIN (Design File) - 80% Peluang
  //       if (Math.random() > 0.2) {
  //           await prisma.designFile.create({
  //               data: {
  //                   id: generateRandomId("des"),
  //                   orderId: order.id,
  //                   nama: `Desain Final ${getRandomItem(firstNames)}`,
  //                   filePath: `/storage/mockup_dummy/${getRandomItem(designFiles)}`,
  //                   uploadedById: adminId,
  //                   createdAt: orderDate
  //               }
  //           });
  //       }

  //       // 7b. SPK & MANAJEMEN PRODUKSI - 70% Peluang
  //       let createdSpkId = null;
  //       if (Math.random() > 0.3) {
  //           createdSpkId = `spk_dummy_${i}`;
  //           const spkStatus = order.statusProduksi === "SELESAI" ? "SELESAI" : "AKTIF";
  //           await prisma.sPK.create({
  //               data: {
  //                   id: createdSpkId,
  //                   orderId: order.id,
  //                   karyawanId: `kar_dummy_${getRandomInt(1, 20)}`,
  //                   userId: adminId,
  //                   tahapProduksi: order.statusProduksi, // Mirroring stat PRODUKSI
  //                   model: `Model ${getRandomItem(["Standar", "Kombinasi Warna", "Custom Jahitan"])}`,
  //                   tali: getRandomItem(["Polos Hitam", "Bisban", "Kulit Sintetis"]),
  //                   ukuran: getRandomItem(["10x20", "30x40", "25x35", "Custom"]),
  //                   jumlah: totalQty,
  //                   catatan: "Kerjakan sesuai deadline di WA",
  //                   tanggalSetor: isPaid ? new Date(orderDate.getTime() + 86400000 * getRandomInt(3, 10)) : null,
  //                   accCetak: Math.random() > 0.5,
  //                   statusSPK: spkStatus as any,
  //                   createdAt: orderDate
  //               }
  //           });

  //           // 7c. PENGELUARAN BARANG (Barang Keluar untuk Produksi SPK Ini) - Hanya bila SPK Aktif/Selesai
  //           if (spkStatus === "AKTIF" || spkStatus === "SELESAI") {
  //               const outId = generateRandomId("out");
  //               await prisma.pengeluaranBarang.create({
  //                   data: {
  //                       id: outId,
  //                       spkId: createdSpkId,
  //                       tanggal: orderDate, // Hari yang sama diproduksi
  //                       keterangan: `Gunakan untuk produksi SPK pesanan ${order.nomorOrder}`,
  //                       addedById: adminId,
  //                       items: {
  //                           create: [
  //                               {
  //                                   id: generateRandomId("st_out"),
  //                                   bahanBakuId: `bb_dummy_${getRandomInt(1, 100)}`,
  //                                   jumlah: getRandomInt(totalQty * 0.5, totalQty * 2), // Pemakaian bahan wajar
  //                               }
  //                           ]
  //                       }
  //                   }
  //               });
  //           }
  //       }

  //       // 7d. PAYMENTS & JURNAL (Jika ada pembayaran)
  //       if (paymentAmount > 0) {
  //           const payId = `pay_dummy_${i}`;
  //           await prisma.payment.create({
  //               data: {
  //                   id: payId,
  //                   orderId: order.id,
  //                   nominal: paymentAmount,
  //                   metodePembayaran: order.metodePembayaran,
  //                   keterangan: `Customer transfer via Kas`,
  //                   tanggal: orderDate,
  //                   userId: adminId,
  //               }
  //           });

  //           await prisma.jurnalUmum.create({
  //               data: {
  //                   id: `jur_sales_dummy_${i}`,
  //                   ref: `REF-PAY-${i.toString().padStart(4, '0')}`,
  //                   tanggal: orderDate,
  //                   keterangan: `Pemb. Order ${order.nomorOrder}`,
  //                   akunDebetId: "akun_1001", // Kas Bank (Masuk)
  //                   akunKreditId: "akun_4001", // P.Konveksi
  //                   nominal: paymentAmount,
  //                   paymentId: payId,
  //                   createdById: adminId
  //               }
  //           });
  //       }
  //   }

  //   // 8. Seed Costs & Expense Jurnals (200 records)
  //   console.log("⏳ Seeding 200 Costs Operasional & Jurnal...");
  //   for (let i = 1; i <= 200; i++) {
  //      const costId = `cost_dummy_${i}`;
  //      const existCost = await prisma.cost.findUnique({ where: { id: costId } });
  //      if (existCost) continue;

  //      const costDate = getRandomDate(baseDate, endDate);
  //      // Mix of various costs
  //      const akunCostOptions = ["akun_5011", "akun_5013", "akun_5016", "akun_5014", "akun_5012"];
  //      const costAkun = getRandomItem(akunCostOptions);
  //      const nominalCost = getRandomInt(2, 100) * 10000;

  //      await prisma.cost.create({
  //        data: {
  //           id: costId,
  //           tanggal: costDate,
  //           akunId: costAkun,
  //           nama: `Pengeluaran ${getRandomItem(["Harian", "Mingguan", "Rutin", "Dadakan"])} - ${i}`,
  //           nominal: nominalCost,
  //           keterangan: `Nota terlampir No. ${getRandomInt(1000, 9999)}`,
  //           userId: adminId,
  //        }
  //      });

  //      await prisma.jurnalUmum.create({
  //        data: {
  //          id: `jur_cost_dummy_${i}`,
  //          ref: `REF-COST-${i.toString().padStart(4, '0')}`,
  //          tanggal: costDate,
  //          keterangan: `Biaya Operasional B${i}`,
  //          akunDebetId: costAkun,
  //          akunKreditId: "akun_1001",
  //          nominal: nominalCost,
  //          costId: costId,
  //          createdById: adminId
  //        }
  //      });
  //   }
  // }

  // 9. Seed Jurnal Tabungan (alokasi per bulan, per kategori)
  // console.log("⏳ Seeding Jurnal Tabungan per bulan...");

  // // Akun Tabungan (debet) yang namanya mengandung "Tabungan"
  // const tabunganAkuns = [
  //   { id: "akun_1004", nama: "Tabungan Kas" },
  //   { id: "akun_1005", nama: "Tabungan Alokasi Pembangunan" },
  //   { id: "akun_1006", nama: "Tabungan Pengembangan SDM" },
  //   { id: "akun_1007", nama: "Tabungan THR" },
  //   { id: "akun_1008", nama: "Tabungan CSR" },
  //   { id: "akun_1009", nama: "Tabungan Piknik" },
  //   { id: "akun_1010", nama: "Tabungan Perawatan Mesin" },
  // ];

  // // Nominal alokasi realistis per kategori (Rp)
  // const nominalByAkun: Record<string, number> = {
  //   "akun_1004": 2_000_000,  // Tabungan Kas
  //   "akun_1005": 5_000_000,  // Pembangunan - lebih besar
  //   "akun_1006": 1_500_000,  // SDM
  //   "akun_1007": 3_000_000,  // THR - rutin tiap bulan
  //   "akun_1008": 500_000,    // CSR
  //   "akun_1009": 750_000,    // Piknik
  //   "akun_1010": 2_500_000,  // Perawatan Mesin
  // };

  // // Seed 2025 (Jan–Des) dan 2026 (Jan–Apr current)
  // const seedYears = [2025, 2026];
  // let tabIdx = 1;

  // for (const year of seedYears) {
  //   const maxBulan = year === 2026 ? 4 : 12; // 2026 hanya sampai bulan 4 (April)
  //   for (let bulan = 1; bulan <= maxBulan; bulan++) {
  //     for (const akun of tabunganAkuns) {
  //       const jurnalId = `jur_tabungan_${year}_${bulan}_${akun.id}`;
  //       const existJurnal = await prisma.jurnalUmum.findUnique({ where: { id: jurnalId } });
  //       if (existJurnal) { tabIdx++; continue; }

  //       // Skip beberapa entry biar tidak terlalu sempurna (lebih realistis)
  //       if (Math.random() < 0.15) { tabIdx++; continue; }

  //       const tanggal = new Date(year, bulan - 1, 5); // Selalu tanggal 5 tiap bulan
  //       const variasi = Math.random() > 0.3 ? 1 : (Math.random() > 0.5 ? 0.8 : 1.2); // sedikit variasi nominal
  //       const nominal = Math.round(nominalByAkun[akun.id] * variasi);

  //       await prisma.jurnalUmum.create({
  //         data: {
  //           id: jurnalId,
  //           ref: `TAB-${year}-${bulan.toString().padStart(2,"0")}-${tabIdx.toString().padStart(3,"0")}`,
  //           tanggal,
  //           keterangan: `Alokasi ${akun.nama} Bln ${bulan}/${year}`,
  //           akunDebetId: akun.id,      // Tabungan bertambah (Debet)
  //           akunKreditId: "akun_1001", // Dari Kas Bank (Kredit)
  //           nominal,
  //           createdById: adminId,
  //         },
  //       });
  //       tabIdx++;
  //     }
  //   }
  // }
  // console.log(`✅ Jurnal Tabungan Seeded (${tabIdx} entries processed)`);

  console.log("✅ SUPER MASSIVE Dummy Variatif Seeding completed!");
}
