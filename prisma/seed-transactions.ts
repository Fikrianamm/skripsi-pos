/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";

// Utilities
const getRandomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export async function seedTransactions() {
  console.log("🌱 Seeding Transactions (Januari - Mei)...");

  const year = 2026;
  const months = [1, 2, 3, 4, 5];
  
  // 1. Get necessary data
  const accounts = await prisma.akun.findMany();
  const customers = await prisma.customer.findMany({ where: { id: { startsWith: "cust_dummy_" } } });
  const products = await prisma.product.findMany();
  const karyawan = await prisma.karyawan.findMany({ where: { id: { startsWith: "kar_dummy_" } } });
  const suppliers = await prisma.supplier.findMany({ where: { id: { startsWith: "sup_dummy_" } } });
  const bahanBaku = await prisma.bahanBaku.findMany({ where: { id: { startsWith: "bb_dummy_" } } });
  const kasBank = await prisma.kasBank.findFirst({ where: { id: "kb_1" } });
  const appSettings = await prisma.appSetting.findUnique({ where: { id: 1 } });
  const piutangAkun = accounts.find(a => a.kodeAkun === "1-003");
  const pendapatanAkunId = appSettings?.defaultPendapatanAkunId || accounts.find(a => a.kodeAkun === "4-001")?.id;

  if (!accounts.length || !customers.length || !products.length || !karyawan.length || !kasBank) {
    console.error("❌ Pre-requisite data missing. Please seed Finance, Products, and Dummy Master first.");
    return;
  }

  const adminUser = await prisma.user.findFirst({ where: { role: "admin" } });

  for (const month of months) {
    const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(year, month - 1));
    console.log(`⏳ Seeding transactions for ${monthName}...`);

    // Check if month already seeded
    const orderCount = await prisma.order.count({
      where: { nomorOrder: { startsWith: `DUMMY-ORD-${year}-${String(month).padStart(2, '0')}-` } }
    });
    if (orderCount >= 15) {
      console.log(`  ⏭️ ${monthName} transactions already seeded, skipping...`);
      continue;
    }

    // A. Penerimaan Barang (Awal Bulan)
    const penerimaanId = `penerimaan_dummy_${year}_${month}`;
    const tanggalAwal = new Date(year, month - 1, 1, 9, 0, 0);
    
    const existingPenerimaan = await prisma.penerimaanBarang.findUnique({ where: { id: penerimaanId } });
    if (!existingPenerimaan) {
      await prisma.penerimaanBarang.create({
        data: {
          id: penerimaanId,
          nomorFaktur: `FAK-${year}${String(month).padStart(2, '0')}-001`,
          supplierId: getRandomItem(suppliers).id,
          tanggal: tanggalAwal,
          keterangan: `Pembelian stok awal bulan ${monthName}`,
          totalTagihan: 5000000,
          addedById: adminUser?.id,
          items: {
            create: bahanBaku.slice(0, 10).map(bb => ({
              id: `stok_masuk_${bb.id}_${month}`,
              bahanBakuId: bb.id,
              jumlah: 1000,
              hargaBeli: 500,
              totalHargaItem: 500000,
            }))
          }
        }
      });

      // Update stok bahan baku manually since it's a seeder
      await Promise.all(bahanBaku.slice(0, 10).map(bb => 
        prisma.bahanBaku.update({
          where: { id: bb.id },
          data: { stok: { increment: 1000 } }
        })
      ));
    }

    // B. Beban Operasional (Semua jenis biaya)
    const costAccounts = accounts.filter(a => a.kodeAkun.startsWith("5-"));
    for (const costAkun of costAccounts) {
      const nominal = getRandomInt(100000, 2000000); // Nominal bervariasi
      const tanggalCost = new Date(year, month - 1, getRandomInt(2, 28), 10, 0, 0);
      const costId = `cost_dummy_${year}_${month}_${costAkun.kodeAkun.replace("-", "")}`;

      const existingCost = await prisma.cost.findUnique({ where: { id: costId } });
      if (!existingCost) {
        await prisma.cost.create({
          data: {
            id: costId,
            akunId: costAkun.id,
            userId: adminUser?.id,
            nama: `Biaya ${costAkun.namaAkun}`,
            nominal: nominal,
            tanggal: tanggalCost,
            jurnalUmum: {
              create: {
                id: `jurnal_cost_${costId}`,
                ref: `COST-${month}-${costAkun.kodeAkun}`,
                tanggal: tanggalCost,
                keterangan: `Pengeluaran ${costAkun.namaAkun}`,
                akunDebetId: costAkun.id,
                akunKreditId: kasBank.akunId!,
                nominal: nominal,
                createdById: adminUser?.id,
              }
            }
          }
        });
      }
    }

    // C. Pesanan, SPK, Payment (15 per bulan)
    for (let i = 1; i <= 15; i++) {
      const isBeforeMay = month < 5;
      const orderId = `order_dummy_${year}_${month}_${i}`;
      const nomorOrder = `DUMMY-ORD-${year}-${String(month).padStart(2, '0')}-${String(i).padStart(3, '0')}`;
      const tanggalOrder = new Date(year, month - 1, getRandomInt(1, 28), getRandomInt(8, 17), getRandomInt(0, 59), 0);
      
      const selectedProducts = [getRandomItem(products), getRandomItem(products), getRandomItem(products)];
      const itemsData = selectedProducts.map((p, idx) => {
        const qty = getRandomInt(50, 500); // Jumlah besar
        return {
          id: `item_${orderId}_${idx}`,
          productId: p.id,
          nama: p.nama,
          harga: p.hargaJual,
          qty: qty,
          subtotal: Number(p.hargaJual) * qty,
        };
      });

      const subtotal = itemsData.reduce((sum, item) => sum + item.subtotal, 0);
      const grandTotal = subtotal;

      const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
      if (!existingOrder) {
        await prisma.order.create({
          data: {
            id: orderId,
            nomorOrder: nomorOrder,
            customerId: getRandomItem(customers).id,
            userId: adminUser?.id,
            statusProduksi: isBeforeMay ? "SELESAI" : getRandomItem(["PENDING", "DESAIN", "PRODUKSI", "PACKING"]),
            statusPembayaran: isBeforeMay ? "LUNAS" : "BELUM_BAYAR",
            subtotal: subtotal,
            grandTotal: grandTotal,
            createdAt: tanggalOrder,
            items: {
              create: itemsData
            },
            spk: {
              create: {
                id: `spk_${orderId}`,
                nomorSpk: `DUMMY-SPK-${year}-${month}-${i}`,
                karyawanId: getRandomItem(karyawan).id,
                tahapProduksi: isBeforeMay ? "SELESAI" : "PRODUKSI",
                jumlah: 2,
                statusSPK: isBeforeMay ? "SELESAI" : "AKTIF",
                createdAt: tanggalOrder,
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
                      }))
                    }
                  }
                }
              }
            }
          }
        });

        // Update stok bahan baku
        await Promise.all(bahanBaku.slice(0, 3).map(bb => 
          prisma.bahanBaku.update({
            where: { id: bb.id },
            data: { stok: { decrement: 5 } }
          })
        ));
      }

      // D. Payment & Jurnal (Jika Lunas)
      if (isBeforeMay) {
        const paymentId = `pay_dummy_${orderId}`;
        const existingPayment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!existingPayment) {
          await prisma.payment.create({
            data: {
              id: paymentId,
              orderId: orderId,
              userId: adminUser?.id,
              nominal: grandTotal,
              tanggal: tanggalOrder,
              jurnalUmum: {
                create: {
                  id: `jurnal_pay_${paymentId}`,
                  ref: `PAY-${month}-${i}`,
                  tanggal: tanggalOrder,
                  keterangan: `Pembayaran Order ${nomorOrder}`,
                  akunDebetId: kasBank.akunId!,
                  akunKreditId: pendapatanAkunId!,
                  nominal: grandTotal,
                  createdById: adminUser?.id,
                }
              }
            }
          });
        }
      }
    }
  }

  console.log("✅ Transactions Seeding completed!");
}
