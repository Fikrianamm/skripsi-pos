/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";

// Utility functions
function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log("🌱 Generating Dummy Data...");

  // Prerequisites
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.error("No users found. Run seed.ts first.");
    return;
  }
  const products = await prisma.product.findMany();
  if (products.length === 0) {
    console.error("No products found. Run seed-product.ts first.");
    return;
  }
  const units = await prisma.unit.findMany();
  if (units.length === 0) {
    console.error("No units found. Run seed-product.ts first.");
    return;
  }

  // 1. Karyawan
  const karyawanNames = ["Andi", "Budi", "Citra", "Dewi", "Eko", "Fina", "Gilang", "Hana", "Irfan", "Joko"];
  const karyawanList = [];
  for (const name of karyawanNames) {
    karyawanList.push(
      await prisma.karyawan.create({
        data: {
          id: uid("kry_"),
          nama: name,
          nomorHp: `0812${randInt(10000000, 99999999)}`,
          posisi: randElement(["Penjahit", "Penyablon", "Packing", "Pemotong"]),
          isActive: true,
        },
      })
    );
  }
  console.log(`✅ Created ${karyawanList.length} Karyawan`);

  // 2. Customers
  const customerNames = ["PT Maju Jaya", "CV Berkah", "Toko Laris", "Ahmad", "Siti", "Bagus", "Lestari", "Dina", "Agus", "Wati", "Koperasi Karyawan", "Universitas A", "SMA B", "Doni", "Rendi", "Santi", "Mega", "Farid", "Diana", "Rina"];
  const customerList = [];
  for (const name of customerNames) {
    customerList.push(
      await prisma.customer.create({
        data: {
          id: uid("cust_"),
          nama: name,
          nomorHp: `081${randInt(10000000, 99999999)}`,
        },
      })
    );
  }
  console.log(`✅ Created ${customerList.length} Customers`);

  // 3. Suppliers
  const supplierNames = ["Supplier Kain A", "Toko Sablon B", "Mitra Plastik", "Grosir Resleting", "Distributor Tali", "Pabrik Benang", "Percetakan C", "Toko Kancing", "Mitra ATK", "Grosir Kemasan"];
  const supplierList = [];
  for (const name of supplierNames) {
    supplierList.push(
      await prisma.supplier.create({
        data: {
          id: uid("sup_"),
          nama: name,
          nomorHp: `085${randInt(10000000, 99999999)}`,
          alamat: "Jl. Industri No. " + randInt(1, 100),
          isActive: true,
        },
      })
    );
  }
  console.log(`✅ Created ${supplierList.length} Suppliers`);

  // 4. Cost Categories
  const costCategoryNames = [
    { nama: "Listrik & Air", jenisBeban: "Operasional" },
    { nama: "Gaji Karyawan", jenisBeban: "Gaji" },
    { nama: "Pemeliharaan Mesin", jenisBeban: "Perawatan" },
    { nama: "Transportasi", jenisBeban: "Logistik" },
    { nama: "ATK & Kantor", jenisBeban: "Operasional" },
  ];
  const costCategoryList = [];
  for (const c of costCategoryNames) {
    costCategoryList.push(
      await prisma.costCategory.create({
        data: {
          id: uid("cc_"),
          nama: c.nama,
          jenisBeban: c.jenisBeban,
        },
      })
    );
  }
  console.log(`✅ Created ${costCategoryList.length} Cost Categories`);

  // 5. Costs
  let costCount = 0;
  for (let i = 0; i < 30; i++) {
    const cat = randElement(costCategoryList);
    await prisma.cost.create({
      data: {
        id: uid("cost_"),
        costCategoryId: cat.id,
        nama: `Pembayaran ${cat.nama} ${i+1}`,
        nominal: randInt(50000, 5000000),
        keterangan: `Keterangan pembayaran ${i+1}`,
        buktiNota: "",
        tanggal: randDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
      },
    });
    costCount++;
  }
  console.log(`✅ Created ${costCount} Costs`);

  // 6. Bahan Baku
  const bahanBakuNames = ["Kain Blacu", "Kain Spunbond", "Kain Kanvas", "Resleting YKK", "Tali Kur", "Tali Bisban", "Benang Jahit Hitam", "Benang Jahit Putih", "Plastik Packing", "Tinta Sablon Hitam", "Tinta Sablon Putih", "Lakban", "Kertas HVS", "Kancing Besi", "Ring D Besi"];
  const bahanBakuList = [];
  const unitPcs = units.find(u => u.nama === "Pcs") || units[0];
  for (const name of bahanBakuNames) {
    // Variatif stok: 0% - 20% kosong, 20% - 40% menipis, sisanya normal
    const rand = Math.random();
    let stok = 0;
    const minStok = randInt(10, 50);

    if (rand < 0.2) {
      // Habis
      stok = 0;
    } else if (rand < 0.4) {
      // Menipis (di bawah minStok)
      stok = randInt(1, minStok - 1);
    } else {
      // Normal
      stok = randInt(minStok + 10, 500);
    }

    bahanBakuList.push(
      await prisma.bahanBaku.create({
        data: {
          id: uid("bb_"),
          unitId: unitPcs.id,
          nama: name,
          stok,
          minStok,
          isActive: true,
        },
      })
    );
  }
  console.log(`✅ Created ${bahanBakuList.length} Bahan Baku`);

  // 7. Penerimaan Barang (Restock Bahan Baku)
  let pbCount = 0;
  for (let i = 0; i < 15; i++) {
    const supplier = randElement(supplierList);
    const admin = users.find(u => u.role === "admin") || users[0];
    const pb = await prisma.penerimaanBarang.create({
      data: {
        id: uid("pb_"),
        nomorFaktur: `INV-SUP-${randInt(1000, 9999)}`,
        supplierId: supplier.id,
        tanggal: randDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), new Date()),
        keterangan: "Pembelian Rutin",
        addedById: admin.id,
        totalTagihan: 0,
      },
    });

    let total = 0;
    const numItems = randInt(1, 5);
    for (let j = 0; j < numItems; j++) {
      const bb = randElement(bahanBakuList);
      const qty = randInt(10, 100);
      const price = randInt(1000, 50000);
      const sub = qty * price;
      total += sub;
      
      await prisma.stokMasuk.create({
        data: {
          id: uid("sm_"),
          penerimaanId: pb.id,
          bahanBakuId: bb.id,
          jumlah: qty,
          hargaBeli: price,
          totalHargaItem: sub,
        },
      });
    }

    await prisma.penerimaanBarang.update({
      where: { id: pb.id },
      data: { totalTagihan: total },
    });
    pbCount++;
  }
  console.log(`✅ Created ${pbCount} Penerimaan Barang with Items`);

  // 8. Orders
  let orderCount = 0;
  const statusesProduksi : any[] = ["PENDING", "DESAIN", "POTONG", "SABLON", "JAHIT", "PACKING", "SELESAI", "BATAL"];
  const channels : any[] = ["LANGSUNG", "WHATSAPP", "INSTAGRAM", "MARKETPLACE", "WEBSITE", "LAINNYA"];
  const paymentStatuses : any[] = ["BELUM_BAYAR", "DP", "LUNAS", "REFUND"];
  const payMethods : any[] = ["TUNAI", "TRANSFER", "QRIS", "KREDIT", "LAINNYA"];

  for (let i = 0; i < 50; i++) {
    const customer = randElement(customerList);
    const channel = randElement(channels);
    const stProd = randElement(statusesProduksi);
    const stPay = randElement(paymentStatuses);
    const method = randElement(payMethods);
    const dDate = randDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    
    // items
    const numItems = randInt(1, 4);
    let subtotal = 0;
    const itemsData = [];
    for (let j = 0; j < numItems; j++) {
      const p = randElement(products);
      const qty = randInt(1, 50);
      const hrg = Number(p.hargaJual) || randInt(10000, 50000);
      const sub = qty * hrg;
      subtotal += sub;
      itemsData.push({
        id: uid("oi_"),
        productId: p.id,
        nama: p.nama,
        harga: hrg,
        qty: qty,
        subtotal: sub,
      });
    }

    const diskon = randInt(0, 1) === 1 ? randInt(5000, 20000) : 0;
    const ongkir = randInt(0, 1) === 1 ? randInt(10000, 50000) : 0;
    const gTotal = subtotal - diskon + ongkir;
    const adminUser = users.find(u => u.role === "admin") || users[0];

    const ord = await prisma.order.create({
      data: {
        id: uid("ord_"),
        customerId: customer.id,
        nomorOrder: `ORD-${Date.now().toString().slice(-6)}-${randInt(100, 999)}`,
        channel,
        statusProduksi: stProd,
        statusPembayaran: stPay,
        metodePembayaran: method,
        deadline: dDate,
        subtotal,
        diskon,
        ongkir,
        grandTotal: gTotal,
        userId: adminUser.id,
        items: {
          create: itemsData,
        },
      },
    });

    // 9. SPK (if not PENDING/BATAL, maybe create an SPK)
    if (stProd !== "PENDING" && stProd !== "BATAL") {
      const karyawan = randElement(karyawanList);
      const statusSPKs : any[] = ["DRAFT", "AKTIF", "SELESAI", "REVISI"];
      
      await prisma.sPK.create({
        data: {
          id: uid("spk_"),
          orderId: ord.id,
          karyawanId: karyawan.id,
          tahapProduksi: stProd,
          jumlah: itemsData.reduce((acc, curr) => acc + curr.qty, 0),
          statusSPK: randElement(statusSPKs),
          userId: adminUser.id,
          accCetak: randInt(0,1) === 1,
        },
      });
    }
    orderCount++;
  }
  console.log(`✅ Created ${orderCount} Orders and their SPKs`);

  console.log("\n🎉 Dummy seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Dummy Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
