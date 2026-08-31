/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";

// Utilities
const getRandomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Variatif Data Dictionaries
const firstNames = ["Budi", "Siti", "Andi", "Rini", "Ahmad", "Dewi", "Eko", "Maya", "Joko", "Putri", "Rizky", "Mega", "Hendra", "Dina", "Agus", "Lina", "Reza", "Ayu", "Fajar", "Tari", "Rio", "Nia", "Ari", "Sari"];
const lastNames = ["Santoso", "Wijaya", "Kusuma", "Setiawan", "Pratama", "Lestari", "Nugroho", "Sari", "Hidayat", "Saputra", "Wulandari", "Maulana", "Sanjaya", "Permana", "Mulyadi", "Gunawan", "Rahma", "Putra"];
const cities = ["Jakarta", "Bandung", "Surabaya", "Semarang", "Yogyakarta", "Medan", "Makassar", "Bali", "Malang", "Solo", "Bogor", "Depok", "Tangerang", "Bekasi", "Denpasar", "Palembang", "Pekanbaru"];
const materials = ["Kain Blacu", "Kain Canvas", "Kain Spunbond", "Benang Jahit", "Tinta Sablon", "Tali Kur", "Kancing Besi", "Plastik Mika", "Resleting Daun", "Resleting Kepala", "Tali Bisban", "Kain Drill"];
const suppliersPrefix = ["PT", "CV", "Toko", "Grosir", "Pabrik", "UD", "Distributor", "Koperasi"];
const positions = ["Desainer", "Tukang Jahit", "Tukang Sablon", "Tukang Potong", "Admin Gudang"];

export async function seedDummy() {
  console.log("🌱 Menambahkan SUPER MASSIVE Dummy Data dengan Variasi Tingkat Tinggi...");

  // Check if already seeded
  const karyawanCount = await prisma.karyawan.count();
  if (karyawanCount >= 20) {
    console.log("  ⏭️ Karyawan already seeded, skipping...");
  } else {
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
  }

  const customerCount = await prisma.customer.count();
  if (customerCount >= 20) {
    console.log("  ⏭️ Customers already seeded, skipping...");
  } else {
    // 2. Seed Customer (20 records)
    console.log("⏳ Seeding 100 Customers...");
    const customerData = [];
    for (let i = 1; i <= 20; i++) {
      customerData.push({
        id: `cust_dummy_${i}`,
        nama: `${getRandomItem(firstNames)} ${getRandomItem(lastNames)} (Cust ${i})`,
        nomorHp: `085${getRandomInt(100000000, 999999999)}`,
      });
    }
    await prisma.customer.createMany({ data: customerData, skipDuplicates: true });
  }

  const supplierCount = await prisma.supplier.count();
  if (supplierCount >= 20) {
    console.log("  ⏭️ Suppliers already seeded, skipping...");
  } else {
    // 3. Seed Supplier (20 records)
    console.log("⏳ Seeding 50 Suppliers...");
    const supplierData = [];
    for (let i = 1; i <= 20; i++) {
      supplierData.push({
        id: `sup_dummy_${i}`,
        nama: `${getRandomItem(suppliersPrefix)} ${getRandomItem(lastNames)} ${getRandomItem(cities)}`,
        nomorHp: `021${getRandomInt(1000000, 9999999)}`,
        alamat: `Kawasan Industri ${getRandomItem(cities)} Blok ${getRandomItem(["A", "B", "C", "D"])}${getRandomInt(1, 20)}`,
        keterangan: `Supplier ${getRandomItem(materials)} Utama`,
      });
    }
    await prisma.supplier.createMany({ data: supplierData, skipDuplicates: true });
  }

  const bbCount = await prisma.bahanBaku.count();
  if (bbCount >= 20) {
    console.log("  ⏭️ Bahan Baku already seeded, skipping...");
  } else {
    // 4. Seed Bahan Baku (20 records)
    console.log("⏳ Seeding 20 Bahan Baku... (Dan mengatur stok berjalan)");
    const bahanBakuData = [];
    for (let i = 1; i <= 20; i++) {
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
  }

  // 5. Seed BOM (ProductBahanBaku)
  const productBOMCount = await prisma.productBahanBaku.count();
  if (productBOMCount > 0) {
    console.log("  ⏭️ Product BOM already seeded, skipping...");
  } else {
    console.log("⏳ Seeding Product BOM (Resep Bahan Baku)...");
    const products = await prisma.product.findMany({ select: { id: true, isService: true } });
    const bahanBakus = await prisma.bahanBaku.findMany({ select: { id: true } });

    if (products.length > 0 && bahanBakus.length > 0) {
      const bomData = [];
      for (const p of products) {
        if (p.isService) continue; // Jasa tidak butuh bahan baku
        // Pilih 2-4 bahan baku random untuk setiap produk
        const numBahan = getRandomInt(2, 4);
        const selectedBahan = new Set<string>();
        while (selectedBahan.size < numBahan) {
          selectedBahan.add(getRandomItem(bahanBakus).id);
        }
        for (const bbId of selectedBahan) {
          bomData.push({
            productId: p.id,
            bahanBakuId: bbId,
            jumlahButuh: getRandomInt(1, 10) / 10, // 0.1 - 1.0
          });
        }
      }
      await prisma.productBahanBaku.createMany({ data: bomData, skipDuplicates: true });
    }
  }

  console.log("✅ Dummy Seeding completed!");
}
