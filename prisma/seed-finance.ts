/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("🌱 Starting Finance Seeding...");

  // 1. Seed Chart of Accounts
  console.log("⏳ Seeding Accounts (Chart of Accounts)...");
  const accounts = [
    // Aktiva Lancar (Debet)
    { kodeAkun: "1-001", namaAkun: "Kas Utama", kelompok: "AKTIVA_LANCAR", posisiNormal: "DEBET" },
    { kodeAkun: "1-002", namaAkun: "Bank BCA", kelompok: "AKTIVA_LANCAR", posisiNormal: "DEBET" },
    { kodeAkun: "1-003", namaAkun: "Bank Mandiri", kelompok: "AKTIVA_LANCAR", posisiNormal: "DEBET" },
    { kodeAkun: "1-004", namaAkun: "Piutang Usaha", kelompok: "AKTIVA_LANCAR", posisiNormal: "DEBET" },
    { kodeAkun: "1-005", namaAkun: "Persediaan Barang", kelompok: "AKTIVA_LANCAR", posisiNormal: "DEBET" },
    
    // Aktiva Tetap (Debet)
    { kodeAkun: "1-100", namaAkun: "Mesin Pabrik", kelompok: "AKTIVA_TETAP", posisiNormal: "DEBET" },
    { kodeAkun: "1-101", namaAkun: "Kendaraan", kelompok: "AKTIVA_TETAP", posisiNormal: "DEBET" },

    // Kewajiban (Kredit)
    { kodeAkun: "2-001", namaAkun: "Hutang Usaha", kelompok: "KEWAJIBAN", posisiNormal: "KREDIT" },
    
    // Modal (Kredit)
    { kodeAkun: "3-001", namaAkun: "Modal Pemilik", kelompok: "MODAL", posisiNormal: "KREDIT" },
    { kodeAkun: "3-002", namaAkun: "Laba Ditahan", kelompok: "MODAL", posisiNormal: "KREDIT" },
    
    // Pendapatan (Kredit) - Divisi akan ditentukan saat pencatatan jurnal
    { kodeAkun: "4-001", namaAkun: "Pendapatan Penjualan", kelompok: "PENDAPATAN", posisiNormal: "KREDIT" },
    
    // Beban HPP (Debet)
    { kodeAkun: "5-001", namaAkun: "HPP Produksi", kelompok: "BEBAN_HPP", posisiNormal: "DEBET" },
    { kodeAkun: "5-002", namaAkun: "Ongkos Jahit/Borongan", kelompok: "BEBAN_HPP", posisiNormal: "DEBET" },
    
    // Beban Marketing (Debet)
    { kodeAkun: "6-001", namaAkun: "Biaya Iklan (Ads)", kelompok: "BEBAN_MARKETING", posisiNormal: "DEBET" },
    { kodeAkun: "6-002", namaAkun: "Admin Marketplace", kelompok: "BEBAN_MARKETING", posisiNormal: "DEBET" },
    
    // Beban Gaji (Debet)
    { kodeAkun: "7-001", namaAkun: "Gaji Karyawan Utama", kelompok: "BEBAN_GAJI", posisiNormal: "DEBET" },
    { kodeAkun: "7-002", namaAkun: "Tunjangan / THR", kelompok: "BEBAN_GAJI", posisiNormal: "DEBET" },
    
    // Beban Administrasi (Debet)
    { kodeAkun: "8-001", namaAkun: "Listrik & Air", kelompok: "BEBAN_ADMINISTRASI", posisiNormal: "DEBET" },
    { kodeAkun: "8-002", namaAkun: "Internet", kelompok: "BEBAN_ADMINISTRASI", posisiNormal: "DEBET" },
    { kodeAkun: "8-003", namaAkun: "Transportasi / BBM", kelompok: "BEBAN_ADMINISTRASI", posisiNormal: "DEBET" },
  ];

  for (const acc of accounts) {
    await prisma.akun.upsert({
      where: { kodeAkun: acc.kodeAkun },
      update: {
        namaAkun: acc.namaAkun,
        kelompok: acc.kelompok as any,
        posisiNormal: acc.posisiNormal as any,
      },
      create: {
        id: `akun_${acc.kodeAkun.replace("-", "")}`,
        kodeAkun: acc.kodeAkun,
        namaAkun: acc.namaAkun,
        kelompok: acc.kelompok as any,
        posisiNormal: acc.posisiNormal as any,
      },
    });
  }
  console.log("✅ Seeding Accounts completed!");

  // 2. Seed Jenis Tabungan
  console.log("⏳ Seeding Jenis Tabungan...");
  const tabungan = [
    { nama: "Tabungan THR", keterangan: "Disisihkan untuk THR Karyawan", akunId: "akun_2001" }, // Asumsi dicatat sebagai hutang atau modal khusus. Kita biarkan null jika belum ada akun spesifik, atau buat akun baru nanti.
    { nama: "Tabungan CSR", keterangan: "Dana sosial kemasyarakatan", akunId: "akun_2001" },
    { nama: "Tabungan Piknik", keterangan: "Liburan tahunan karyawan", akunId: "akun_2001" },
    { nama: "Tabungan Mesin", keterangan: "Penyusutan/Pembelian Mesin Baru", akunId: "akun_2001" },
    { nama: "Tabungan Pembangunan", keterangan: "Pengembangan lahan/bangunan", akunId: "akun_2001" },
  ];

  for (let i = 0; i < tabungan.length; i++) {
    const t = tabungan[i];
    const id = `jt_${i + 1}`;
    await prisma.jenisTabungan.upsert({
      where: { id: id },
      update: {
        nama: t.nama,
        keterangan: t.keterangan,
        // akunId: t.akunId, // Skip for now unless we explicitly create standard savings accounts
      },
      create: {
        id: id,
        nama: t.nama,
        keterangan: t.keterangan,
      },
    });
  }
  console.log("✅ Seeding Jenis Tabungan completed!");

  // 3. Seed Kas / Bank
  console.log("⏳ Seeding Kas / Bank...");
  const kasBanks = [
    { id: "kb_1", namaRekening: "Kas Utama Bawah (Laci)", jenisRekening: "CASH", akunId: "akun_1001" },
    { id: "kb_2", namaRekening: "BCA - PT XXX", jenisRekening: "BANK", nomorRekening: "1234567890", akunId: "akun_1002" },
    { id: "kb_3", namaRekening: "Mandiri - PT XXX", jenisRekening: "BANK", nomorRekening: "0987654321", akunId: "akun_1003" },
  ];

  for (const kb of kasBanks) {
    await prisma.kasBank.upsert({
      where: { id: kb.id },
      update: {
        namaRekening: kb.namaRekening,
        jenisRekening: kb.jenisRekening,
        nomorRekening: kb.nomorRekening,
        akunId: kb.akunId,
      },
      create: {
        id: kb.id,
        namaRekening: kb.namaRekening,
        jenisRekening: kb.jenisRekening,
        nomorRekening: kb.nomorRekening,
        akunId: kb.akunId,
      },
    });
  }
  console.log("✅ Seeding Kas / Bank completed!");

  // 4. Seed Cost Categories
  console.log("⏳ Seeding Cost Categories...");
  const costCategories = [
    { id: "cc_1", nama: "Gaji Karyawan Borongan", jenisBeban: "HPP", akunId: "akun_5002" },
    { id: "cc_2", nama: "Ads Meta/Tiktok", jenisBeban: "Marketing", akunId: "akun_6001" },
    { id: "cc_3", nama: "Gaji Staf Tetap", jenisBeban: "Gaji", akunId: "akun_7001" },
    { id: "cc_4", nama: "Listrik & Air Pabrik", jenisBeban: "Administrasi & Umum", akunId: "akun_8001" },
    { id: "cc_5", nama: "Beli Alat Tulis (ATK)", jenisBeban: "Administrasi & Umum", akunId: "akun_8002" },
  ];

  for (const cc of costCategories) {
    await prisma.costCategory.upsert({
      where: { id: cc.id },
      update: {
        nama: cc.nama,
        jenisBeban: cc.jenisBeban,
        akunId: cc.akunId,
      },
      create: {
        id: cc.id,
        nama: cc.nama,
        jenisBeban: cc.jenisBeban,
        akunId: cc.akunId,
      },
    });
  }
  console.log("✅ Seeding Cost Categories completed!");

  console.log("🌱 Finance Seeding Success!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
