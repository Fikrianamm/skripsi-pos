/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";

export async function seedFinance() {
  console.log("🌱 Starting Finance Seeding...");

  const count = await prisma.akun.count();
  if (count > 0) {
    console.log("  ⏭️ Accounts already seeded, skipping finance seeding...");
    return;
  }

  // 1. Seed Chart of Accounts
  console.log("⏳ Seeding Accounts (Chart of Accounts)...");
  const accounts = [
    // Aktiva Lancar → posisiNormal: DEBET
    { kodeAkun: "1-001", namaAkun: "Kas Bank",                     kelompok: "AKTIVA_LANCAR", posisiNormal: "DEBET" },
    { kodeAkun: "1-002", namaAkun: "Uang Cash",                    kelompok: "AKTIVA_LANCAR", posisiNormal: "DEBET" },
    { kodeAkun: "1-003", namaAkun: "Piutang Usaha",                kelompok: "AKTIVA_LANCAR", posisiNormal: "DEBET" },
    { kodeAkun: "1-004", namaAkun: "Tabungan Kas",                 kelompok: "AKTIVA_LANCAR", posisiNormal: "DEBET" },
    { kodeAkun: "1-005", namaAkun: "Tabungan Alokasi Pembangunan", kelompok: "AKTIVA_LANCAR", posisiNormal: "DEBET" },
    { kodeAkun: "1-006", namaAkun: "Tabungan Pengembangan SDM",    kelompok: "AKTIVA_LANCAR", posisiNormal: "DEBET" },
    { kodeAkun: "1-007", namaAkun: "Tabungan THR",                 kelompok: "AKTIVA_LANCAR", posisiNormal: "DEBET" },
    { kodeAkun: "1-008", namaAkun: "Tabungan CSR",                 kelompok: "AKTIVA_LANCAR", posisiNormal: "DEBET" },
    { kodeAkun: "1-009", namaAkun: "Tabungan Piknik",              kelompok: "AKTIVA_LANCAR", posisiNormal: "DEBET" },
    { kodeAkun: "1-010", namaAkun: "Tabungan Perawatan Mesin",     kelompok: "AKTIVA_LANCAR", posisiNormal: "DEBET" },

    // Kewajiban → posisiNormal: KREDIT
    { kodeAkun: "2-001", namaAkun: "Hutang Usaha", kelompok: "KEWAJIBAN", posisiNormal: "KREDIT" },

    // Modal → posisiNormal: KREDIT
    { kodeAkun: "3-001", namaAkun: "Modal Awal", kelompok: "MODAL", posisiNormal: "KREDIT" },
    { kodeAkun: "3-002", namaAkun: "Prive",       kelompok: "MODAL", posisiNormal: "KREDIT" },

    // Pendapatan → posisiNormal: KREDIT (pendapatan bertambah di sisi kredit)
    { kodeAkun: "4-001", namaAkun: "Pendapatan - KONVEKSI",  kelompok: "PENDAPATAN", posisiNormal: "KREDIT" },
    { kodeAkun: "4-002", namaAkun: "Pendapatan - R PRINTING", kelompok: "PENDAPATAN", posisiNormal: "KREDIT" },
    { kodeAkun: "4-003", namaAkun: "Pendapatan - TEXTILE",   kelompok: "PENDAPATAN", posisiNormal: "KREDIT" },

    // Beban Usaha → posisiNormal: DEBET
    { kodeAkun: "5-001", namaAkun: "B. HPP",                kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-002", namaAkun: "B. Gaji Borongan",      kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-003", namaAkun: "B. Iklan - Marketplace", kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-004", namaAkun: "B. Iklan - ADS",         kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-005", namaAkun: "B. Gaji Semua Karyawan",    kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-006", namaAkun: "B. Gaji CEO",               kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-007", namaAkun: "B. Gaji Magang/PKL",        kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-008", namaAkun: "B. THR",                    kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-023", namaAkun: "B. Pengembangan SDM",       kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-009", namaAkun: "B. CSR",                                  kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-010", namaAkun: "B. Kuota Data",                            kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-011", namaAkun: "B. Perlengkapan/ATK",                      kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-012", namaAkun: "B. Internet/Wifi",                         kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-013", namaAkun: "B. PDAM + Listrik",                        kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-014", namaAkun: "B. Konsumsi/Catering",                     kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-015", namaAkun: "B. Kebersihan/Sampah",                     kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-016", namaAkun: "B. BBM Operasional",                       kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-017", namaAkun: "B. Obat-obatan/Kesehatan",                 kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-018", namaAkun: "B. Service",                               kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-019", namaAkun: "B. Gathering/Piknik/Kegiatan Kantor",      kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-020", namaAkun: "B. Langganan Tools",                       kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-021", namaAkun: "B. Kirim Manual/Pengiriman Resi Manual",   kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-022", namaAkun: "B. Admin Bulanan Bank",                    kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-024", namaAkun: "B. Kado",                                  kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
    { kodeAkun: "5-025", namaAkun: "B. Pembangunan",                           kelompok: "BEBAN_USAHA", posisiNormal: "DEBET" },
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

  // 3. Seed Kas / Bank
  console.log("⏳ Seeding Kas / Bank...");
  const kasBanks = [
    { id: "kb_1", namaRekening: "Kas Bank", jenisRekening: "BANK", nomorRekening: "1234567890", akunId: "akun_1001" },
    { id: "kb_2", namaRekening: "Uang Cash", jenisRekening: "CASH", akunId: "akun_1002" },
  ];

  for (const kb of kasBanks) {
    await prisma.kasBank.upsert({
      where: { id: kb.id },
      update: { namaRekening: kb.namaRekening, jenisRekening: kb.jenisRekening, nomorRekening: kb.nomorRekening, akunId: kb.akunId },
      create: { id: kb.id, namaRekening: kb.namaRekening, jenisRekening: kb.jenisRekening, nomorRekening: kb.nomorRekening, akunId: kb.akunId },
    });
  }
  console.log("✅ Seeding Kas / Bank completed!");

  console.log("🌱 Finance Seeding Success!");
}

