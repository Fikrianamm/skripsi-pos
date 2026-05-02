/**
 * Seed data produk tas.
 * Jalankan: npx tsx prisma/seed-product.ts
 * Menggunakan upsert (skip jika SKU sudah ada), tidak mengubah data user.
 */
import { prisma } from "@/lib/prisma";

// ─── Utility ──────────────────────────────────────────────────────────────────
function uid(prefix = "") {
  return (
    prefix +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Estimasi HPP ±15% dibawah harga jual
function estimateHpp(hargaJual: number) {
  const margin = randInt(10, 20) / 100;
  return Math.round(hargaJual * (1 - margin));
}

// ─── Kategori & Unit ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "cat_totebag", nama: "Totebag" },
  { id: "cat_juspet", nama: "Jus Pet / Standing Pouch" },
  { id: "cat_sarungbantal", nama: "Sarung Bantal" },
  { id: "cat_kotak", nama: "Tas Kotak" },
  { id: "cat_fashion", nama: "Tas Fashion" },
  { id: "cat_ransel", nama: "Ransel" },
  { id: "cat_lainnya", nama: "Lainnya" },
];

const UNITS = [
  { id: "unit_pcs", nama: "Pcs" },
  { id: "unit_lusin", nama: "Lusin" },
];

// Mapping SKU prefix → categoryId
function guessCategory(sku: string): string {
  const s = sku.toUpperCase();
  if (s.startsWith("TB")) return "cat_totebag";
  if (s.startsWith("JSP")) return "cat_juspet";
  if (s.startsWith("SB")) return "cat_sarungbantal";
  if (s.startsWith("JF") || s.startsWith("AP")) return "cat_kotak";
  if (s.startsWith("G") || s.startsWith("DL") || s.startsWith("DB"))
    return "cat_fashion";
  if (s.startsWith("RANSEL")) return "cat_ransel";
  return "cat_fashion";
}

// ─── Data produk ──────────────────────────────────────────────────────────────
// Format: [sku, nama, hargaJual]
// hargaJual 0 = harga belum diketahui, akan diisi 0
const RAW_PRODUCTS: [string, string, number][] = [
  ["TB2530 FC", "TB2530 FC", 6750],
  ["TB2530 S", "TB2530 S", 0],
  ["TB2530 POLOS", "TB2530 POLOS", 0],
  ["TB3035 FC", "TB3035 FC", 7500],
  ["TB3035 S", "TB3035 S", 0],
  ["TB3035 POLOS", "TB3035 POLOS", 0],
  ["TB3040 FC", "TB3040 FC", 7800],
  ["TB3040 S", "TB3040 S", 0],
  ["TB3040 POLOS", "TB3040 POLOS", 0],
  ["TB3540 FC", "TB3540 FC", 8400],
  ["JSP20x25-25x25", "JSP20x25-25x25", 6500],
  ["JSP20x30", "JSP20x30", 6500],
  ["JSP25x30-BLACU", "JSP25x30-BLACU", 6900],
  ["JSP25x30-BISAN", "JSP25x30-BISAN", 7300],
  ["JSP25x35-A3", "JSP25x35-A3", 9000],
  ["JSP30x40", "JSP30x40", 8500],
  ["SB25x30", "SB25x30", 6500],
  ["SB25x35", "SB25x35", 8200],
  ["JSP30x10x25", "JSP30x10x25", 8000],
  ["JSP35x10x29", "JSP35x10x29", 9100],
  ["JSP23x23x29", "JSP23x23x29", 10200],
  ["JF26x7x20", "JF26x7x20", 8500],
  ["JF3510x29", "JF3510x29", 10000],
  ["JF3510x29-RSL", "JF3510x29-RSL", 12000],
  ["JF30x10x20-CTT", "JF30x10x20-CTT", 9500],
  ["JF30x10x25-CTT", "JF30x10x25-CTT", 9000],
  ["AP26x19x25", "AP26x19x25", 10500],
  ["AP24x24x27", "AP24x24x27", 13500],
  ["G25x30", "G25x30", 7200],
  ["G30x40", "G30x40", 8700],
  ["DL30x40", "DL30x40", 9999],
  ["DB20x3x15", "DB20x3x15", 4700],
  ["DB18x10", "DB18x10", 3800],
  ["TB30x40-BBYC", "TB30x40-BBYC", 14900],
  ["TB30x40-BBYC-RSL", "TB30x40-BBYC-RSL", 15500],
  ["TB30x40-BBYC-PLS-RSL", "TB30x40-BBYC-PLS-RSL", 14000],
  ["TB24x11x21-BBYC", "TB24x11x21-BBYC", 0],
  ["DB-BBYC-20x3x15", "DB-BBYC-20x3x15", 5400],
  ["MINI-RUBY-30x10x20", "MINI-RUBY-30x10x20", 8700],
  ["MINI-JENNY-30x10x20-1S-TPL", "MINI-JENNY-30x10x20-1S-TPL", 7600],
  [
    "MINI-JENNY-30x10x20-1S-TBSB",
    "MINI-JENNY-30x10x20-1S-TBSB",
    7800,
  ],
  [
    "MINI-JENNY-30x10x20-1S-TKLT",
    "MINI-JENNY-30x10x20-1S-TKLT",
    7999,
  ],
  [
    "MINI-JENNY-30x10x20-2S-TPL",
    "MINI-JENNY-30x10x20-2S-TPL",
    10200,
  ],
  [
    "MINI-JENNY-30x10x20-2S-TBSB",
    "MINI-JENNY-30x10x20-2S-TBSB",
    10350,
  ],
  [
    "MINI-JENNY-30x10x20-2S-TKLT",
    "MINI-JENNY-30x10x20-2S-TKLT",
    10550,
  ],
  ["MINI-LUVY-30x10x20-TMIKA", "MINI-LUVY-30x10x20-TMIKA", 7700],
  ["MINI-LUVY-30x10x20-TBSB", "MINI-LUVY-30x10x20-TBSB", 7900],
  ["MINI-LUVY-30x10x20-TKLT", "MINI-LUVY-30x10x20-TKLT", 8100],
  ["FUNNY-20x13x25-TMIKA", "FUNNY-20x13x25-TMIKA", 7800],
  ["FUNNY-20x13x25-TBSB", "FUNNY-20x13x25-TBSB", 7999],
  ["FUNNY-20x13x25-TKLT", "FUNNY-20x13x25-TKLT", 8199],
  ["CALIA-20x13x25-TPL", "CALIA-20x13x25-TPL", 7650],
  ["CALIA-20x13x25-TBSB", "CALIA-20x13x25-TBSB", 7800],
  ["CALIA-20x13x25-TKLT", "CALIA-20x13x25-TKLT", 7999],
  ["CALIA-BIG-25x13x30-TPL", "CALIA-BIG-25x13x30-TPL", 9550],
  ["CALIA-BIG-25x13x30-TBSB", "CALIA-BIG-25x13x30-TBSB", 9650],
  ["CALIA-BIG-25x13x30-TKLT", "CALIA-BIG-25x13x30-TKLT", 9900],
  ["JP-MMT-27x14x21", "JP-MMT-27x14x21", 3700],
  ["JP-MMT-27x19x21", "JP-MMT-27x19x21", 3950],
  ["AYA-23x13x25-TN", "AYA-23x13x25-TN", 11000],
  ["AYA-23x13x25-PN", "AYA-23x13x25-PN", 12000],
  ["LYORA-23x13x25-TN", "LYORA-23x13x25-TN", 16500],
  ["LYORA-23x13x25-PN", "LYORA-23x13x25-PN", 17500],
  ["KIMMY-25x10x20", "KIMMY-25x10x20", 11000],
  ["RANSEL-TELUR-LAKMI-20x11x22", "RANSEL-TELUR-LAKMI-20x11x22", 9300],
  ["RANSEL-TELUR-MIKA-20x11x22", "RANSEL-TELUR-MIKA-20x11x22", 10500],
  ["TALIA-26x12x20-TN", "TALIA-26x12x20-TN", 15000],
  ["TALIA-26x12x20-PN", "TALIA-26x12x20-PN", 16000],
  ["EMMA-21x13x16-MMTSPUN", "EMMA-21x13x16-MMTSPUN", 5999],
  ["EMMA-21x13x16-OSCARBLACU", "EMMA-21x13x16-OSCARBLACU", 10299],
  ["MELIA-27x19x21", "MELIA-27x19x21", 8999],
  ["KALEA-25x13x20", "KALEA-25x13x20", 9400],
  ["RANIA-30x10x20", "RANIA-30x10x20", 9200],
  ["ECHAN-25x13x20", "ECHAN-25x13x20", 9200],
  ["SUNNY-22x13x26", "SUNNY-22x13x26", 8400],
  ["FULLSUN-26x13x22", "FULLSUN-26x13x22", 8400],
  ["EID-SPUN-30x14x25", "EID-SPUN-30x14x25", 5500],
  ["EID-MIKA-MED-30x14x25", "EID-MIKA-MED-30x14x25", 9000],
  ["EID-MIKA-BIG-40x14x30", "EID-MIKA-BIG-40x14x30", 12000],
  ["JP-MMT-30x15x40", "JP-MMT-30x15x40", 5500],
  ["JP-MMT-20x13x25", "JP-MMT-20x13x25", 3700],
  ["EMILY-25x13x20", "EMILY-25x13x20", 4000],
];

export async function seedProduct() {
  console.log("🌱 Seeding categories & units...");

  // Upsert kategori
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: { id: cat.id, nama: cat.nama },
    });
  }

  // Upsert unit
  for (const unit of UNITS) {
    await prisma.unit.upsert({
      where: { id: unit.id },
      update: {},
      create: { id: unit.id, nama: unit.nama },
    });
  }

  console.log("✅ Categories & units seeded.\n🌱 Seeding products...\n");

  let created = 0;
  let skipped = 0;

  for (const [sku, nama, hargaJual] of RAW_PRODUCTS) {
    const categoryId = guessCategory(sku);
    const hpp = hargaJual > 0 ? estimateHpp(hargaJual) : 0;
    const stok = randInt(10, 100);
    const minStok = randInt(3, 10);

    const result = await prisma.product.upsert({
      where: { sku },
      update: {}, // tidak overwrite jika sudah ada
      create: {
        id: uid("prod_"),
        sku,
        nama,
        categoryId,
        unitId: "unit_pcs",
        hpp,
        hargaJual,
        stok,
        minStok,
        isService: true,
        image: "",
      },
    });

    const isNew = result.id.startsWith("prod_") || true;
    if (isNew) {
      console.log(
        `  ✅ ${sku.padEnd(30)} → Rp ${hargaJual.toLocaleString("id-ID")}`,
      );
      created++;
    } else {
      console.log(`  ⏭️  ${sku} (sudah ada, skip)`);
      skipped++;
    }
  }

  console.log(`\n🎉 Seeding selesai! Dibuat: ${created}, Dilewati: ${skipped}`);
}

