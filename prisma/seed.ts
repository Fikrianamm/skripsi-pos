import { prisma } from "@/lib/prisma";
import { hash } from "@node-rs/argon2";
import { seedFinance } from "./seed-finance";
import { seedProduct } from "./seed-product";
import { seedDummy } from "./seed-dummy";
import { seedTransactions } from "./seed-transactions";

async function main() {
  const defaultPassword = await hash("password");

  const users = [
    {
      id: "QW8sCq9NcZ0aXaag9SWAJRnGfgKFHxMB",
      name: "Admin",
      email: "admin@gmail.com",
      image: "/assets/avatar/female/94.png",
      role: "admin",
      banned: false,
      createdAt: new Date("2026-02-13T09:05:45.588Z"),
    },
    {
      id: "AR9sCq9NcZ0aXaag9SWAJRnGfgKFHxMB",
      name: "Raya",
      email: "desainer@gmail.com",
      image: "/assets/avatar/female/94.png",
      role: "designer",
      banned: false,
      createdAt: new Date("2026-02-13T09:05:45.588Z"),
    },
    {
      id: "uRIFE34uCYKNh0awQOvlB5XL1CoJjGCF",
      name: "Putri",
      email: "produksi@gmail.com",
      image: "/assets/avatar/female/91.png",
      role: "produksi",
      banned: false,
      createdAt: new Date("2026-02-13T09:05:17.509Z"),
    },
    {
      id: "a5m1pZeT4dUMhioUkoYpyBTGYkQRXeMY",
      name: "Budii",
      email: "kasir@gmail.com",
      image: "/assets/avatar/male/41.png",
      role: "kasir",
      banned: false,
      createdAt: new Date("2026-02-13T09:04:17.740Z"),
    },
    {
      id: "bfQCJ5mesozbsEfrnBZyxUMnZRU41uej",
      name: "Dani",
      email: "gudang@gmail.com",
      image: "/assets/avatar/female/91.png",
      role: "gudang",
      banned: false,
      createdAt: new Date("2026-02-13T09:03:22.122Z"),
    },
    {
      id: "DE606LeCej1tynBzkzcCqUkmt7UgZ6fk",
      name: "Fikri",
      email: "fikri@gmail.com",
      image: "/assets/avatar/male/36.png",
      role: "admin",
      banned: false,
      createdAt: new Date("2026-02-13T09:01:00.485Z"),
    },
  ];

  const userCount = await prisma.user.count();
  if (userCount >= 11) {
    console.log("⏭️ Users already seeded, skipping user seeding...");
  } else {
    for (const userData of users) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          emailVerified: false,
          image: userData.image,
          role: userData.role,
          banned: userData.banned,
          createdAt: userData.createdAt,
          accounts: {
            create: {
              id: `acc_${userData.id}`,
              accountId: userData.id,
              providerId: "credential",
              password: defaultPassword,
            },
          },
        },
      });

      console.log(`✅ Seeded user: ${user.name} (${user.email})`);
    }
  }

  await seedFinance();
  await seedProduct();
  await seedDummy();
  await seedTransactions();

  // 4. Seed AppSettings (Single row table)
  console.log("⏳ Seeding App Settings...");
  await prisma.appSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      namaPerusahaan: "CV. Haqi Koleksi",
      logoUrl: "/assets/hq.png", // Default icon
      alamat: "DAREN RT 04/RW 04 NALUMSARI JEPARA 59466",
      nomorKontak: "085712220484/088706695114",
      prefixOrder: "INV-HQ-",
      catatanKakiStruk: "Terima kasih telah berbelanja!",
      prefixSpk: "SPK-",
      estimasiHariPengerjaan: 7,
      defaultPendapatanAkunId: "akun_4001", // Pendapatan - KONVEKSI
    },
  });
  console.log("✅ Seeding App Settings completed!");

  console.log("\n🌱 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
