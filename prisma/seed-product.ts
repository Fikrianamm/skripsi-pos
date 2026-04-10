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
  ["TB2530 FC", "Tas Blacu 25x30 Full Color", 6750],
  ["TB2530 S", "Tas Blacu 25x30 Sablon", 0],
  ["TB2530 POLOS", "Tas Blacu 25x30 Polos", 0],
  ["TB3035 FC", "Tas Blacu 30x35 Full Color", 7500],
  ["TB3035 S", "Tas Blacu 30x35 Sablon", 0],
  ["TB3035 POLOS", "Tas Blacu 30x35 Polos", 0],
  ["TB3040 FC", "Tas Blacu 30x40 Full Color", 7800],
  ["TB3040 S", "Tas Blacu 30x40 Sablon", 0],
  ["TB3040 POLOS", "Tas Blacu 30x40 Polos", 0],
  ["TB3540 FC", "Tas Blacu 35x40 Full Color", 8400],
  ["JSP20x25-25x25", "JSP 20x25/25x25", 6500],
  ["JSP20x30", "JSP 20x30", 6500],
  ["JSP25x30-BLACU", "JSP 25x30 Blacu", 6900],
  ["JSP25x30-BISAN", "JSP 25x30 Bisan", 7300],
  ["JSP25x35-A3", "JSP 25x35 A3", 9000],
  ["JSP30x40", "JSP 30x40", 8500],
  ["SB25x30", "Sarung Bantal 25x30", 6500],
  ["SB25x35", "Sarung Bantal 25x35", 8200],
  ["JSP30x10x25", "JSP 30x10x25", 8000],
  ["JSP35x10x29", "JSP 35x10x29/35x15x27", 9100],
  ["JSP23x23x29", "JSP 23x23x29", 10200],
  ["JF26x7x20", "JF 26x7x20", 8500],
  ["JF3510x29", "JF 35x10x29", 10000],
  ["JF3510x29-RSL", "JF 35x10x29 Resleting", 12000],
  ["JF30x10x20-CTT", "JF 30x10x20 Cetit", 9500],
  ["JF30x10x25-CTT", "JF 30x10x25 Cetit", 9000],
  ["AP26x19x25", "AP 26x19x25", 10500],
  ["AP24x24x27", "AP 24x24x27", 13500],
  ["G25x30", "Goodie Bag 25x30", 7200],
  ["G30x40", "Goodie Bag 30x40", 8700],
  ["DL30x40", "DL 30x40", 9999],
  ["DB20x3x15", "DB 20x3x15", 4700],
  ["DB18x10", "DB 18x10", 3800],
  ["TB30x40-BBYC", "TB 30x40 Baby Canvas", 14900],
  ["TB30x40-BBYC-RSL", "TB 30x40 Baby Canvas Resleting", 15500],
  ["TB30x40-BBYC-PLS-RSL", "TB 30x40 Baby Canvas Polos Resleting", 14000],
  ["TB24x11x21-BBYC", "TB 24x11x21 Baby Canvas", 0],
  ["DB-BBYC-20x3x15", "D Baby Canvas 20x3x15", 5400],
  ["MINI-RUBY-30x10x20", "Mini Ruby 30x10x20", 8700],
  ["MINI-JENNY-30x10x20-1S-TPL", "Mini Jenny 30x10x20 1 Sisi Tali Polos", 7600],
  [
    "MINI-JENNY-30x10x20-1S-TBSB",
    "Mini Jenny 30x10x20 1 Sisi Tali Bisban",
    7800,
  ],
  [
    "MINI-JENNY-30x10x20-1S-TKLT",
    "Mini Jenny 30x10x20 1 Sisi Tali Kulit",
    7999,
  ],
  [
    "MINI-JENNY-30x10x20-2S-TPL",
    "Mini Jenny 30x10x20 2 Sisi Tali Polos",
    10200,
  ],
  [
    "MINI-JENNY-30x10x20-2S-TBSB",
    "Mini Jenny 30x10x20 2 Sisi Tali Bisban",
    10350,
  ],
  [
    "MINI-JENNY-30x10x20-2S-TKLT",
    "Mini Jenny 30x10x20 2 Sisi Tali Kulit",
    10550,
  ],
  ["MINI-LUVY-30x10x20-TMIKA", "Mini Luvy 30x10x20 Tali Mika", 7700],
  ["MINI-LUVY-30x10x20-TBSB", "Mini Luvy 30x10x20 Tali Bisban", 7900],
  ["MINI-LUVY-30x10x20-TKLT", "Mini Luvy 30x10x20 Tali Kulit", 8100],
  ["FUNNY-20x13x25-TMIKA", "Funny/Happy Bag 20x13x25 Tali Mika", 7800],
  ["FUNNY-20x13x25-TBSB", "Funny/Happy Bag 20x13x25 Tali Bisban", 7999],
  ["FUNNY-20x13x25-TKLT", "Funny/Happy Bag 20x13x25 Tali Kulit", 8199],
  ["CALIA-20x13x25-TPL", "Calia Bag 20x13x25 Tali Polos", 7650],
  ["CALIA-20x13x25-TBSB", "Calia Bag 20x13x25 Tali Bisban", 7800],
  ["CALIA-20x13x25-TKLT", "Calia Bag 20x13x25 Tali Kulit", 7999],
  ["CALIA-BIG-25x13x30-TPL", "Calia Big 25x13x30 Tali Polos", 9550],
  ["CALIA-BIG-25x13x30-TBSB", "Calia Big 25x13x30 Tali Bisban", 9650],
  ["CALIA-BIG-25x13x30-TKLT", "Calia Big 25x13x30 Tali Kulit", 9900],
  ["JP-MMT-27x14x21", "JP MMT Spund 27x14x21", 3700],
  ["JP-MMT-27x19x21", "JP MMT Spund 27x19x21", 3950],
  ["AYA-23x13x25-TN", "Aya Bag 23x13x25 Tanpa Nama Tali", 11000],
  ["AYA-23x13x25-PN", "Aya Bag 23x13x25 Pakai Nama Tali", 12000],
  ["LYORA-23x13x25-TN", "Lyora Bag 23x13x25 Tanpa Nama Tali", 16500],
  ["LYORA-23x13x25-PN", "Lyora Bag 23x13x25 Pakai Nama Tali", 17500],
  ["KIMMY-25x10x20", "Kimmy Bag 25x10x20", 11000],
  ["RANSEL-TELUR-LAKMI-20x11x22", "Ransel Telur 20x11x22 Lakmitasi", 9300],
  ["RANSEL-TELUR-MIKA-20x11x22", "Ransel Telur 20x11x22 Mika", 10500],
  ["TALIA-26x12x20-TN", "Talia Bag 26x12x20 Tanpa Nama Tali", 15000],
  ["TALIA-26x12x20-PN", "Talia Bag 26x12x20 Pakai Nama Tali", 16000],
  ["EMMA-21x13x16-MMTSPUN", "Emma Bag 21x13x16 MMT x Spun", 5999],
  ["EMMA-21x13x16-OSCARBLACU", "Emma Bag 21x13x16 Oscar x Blacu", 10299],
  ["MELIA-27x19x21", "Melia Bag 27x19x21", 8999],
  ["KALEA-25x13x20", "Kalea Bag 25x13x20", 9400],
  ["RANIA-30x10x20", "Rania Bag 30x10x20", 9200],
  ["ECHAN-25x13x20", "Echan Bag 25x13x20", 9200],
  ["SUNNY-22x13x26", "Sunny Bag 22x13x26", 8400],
  ["FULLSUN-26x13x22", "Fullsun Bag 26x13x22", 8400],
  ["EID-SPUN-30x14x25", "EID Spun 30x14x25", 5500],
  ["EID-MIKA-MED-30x14x25", "EID Mika Medium 30x14x25", 9000],
  ["EID-MIKA-BIG-40x14x30", "EID Mika Big 40x14x30", 12000],
  ["JP-MMT-30x15x40", "JP MMT Spund 30x15x40", 5500],
  ["JP-MMT-20x13x25", "JP MMT Spund 20x13x25", 3700],
  ["EMILY-25x13x20", "Emily Bag 25x13x20", 4000],
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
        isService: false,
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

