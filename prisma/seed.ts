import { prisma } from "@/lib/prisma";
import { hash } from "@node-rs/argon2";
import { seedFinance } from "./seed-finance";
import { seedProduct } from "./seed-product";

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
      email: "raya@gmail.com",
      image: "/assets/avatar/female/94.png",
      role: "designer",
      banned: false,
      createdAt: new Date("2026-02-13T09:05:45.588Z"),
    },
    {
      id: "uRIFE34uCYKNh0awQOvlB5XL1CoJjGCF",
      name: "Putri",
      email: "putri@gmail.com",
      image: "/assets/avatar/female/91.png",
      role: "produksi",
      banned: false,
      createdAt: new Date("2026-02-13T09:05:17.509Z"),
    },
    {
      id: "a5m1pZeT4dUMhioUkoYpyBTGYkQRXeMY",
      name: "Nursya",
      email: "nursya@gmail.com",
      image: "/assets/avatar/male/41.png",
      role: "kasir",
      banned: false,
      createdAt: new Date("2026-02-13T09:04:17.740Z"),
    },
    {
      id: "c9HAcBPpHPDcT8Ld4LlIvVtfCfVLaH0B",
      name: "Clara",
      email: "clara@gmail.com",
      image: "/assets/avatar/female/96.png",
      role: "admin",
      banned: false,
      createdAt: new Date("2026-02-13T09:03:39.836Z"),
    },
    {
      id: "bfQCJ5mesozbsEfrnBZyxUMnZRU41uej",
      name: "Dani",
      email: "dani@gmail.com",
      image: "/assets/avatar/female/91.png",
      role: "gudang",
      banned: false,
      createdAt: new Date("2026-02-13T09:03:22.122Z"),
    },
    {
      id: "aLdfiWXIAs0nmff4NIm7Ev9KJGaFHRKf",
      name: "Athaya Bisma",
      email: "bisma@gmail.com",
      image: "/assets/avatar/female/96.png",
      role: "gudang",
      banned: false,
      createdAt: new Date("2026-02-13T09:02:24.818Z"),
    },
    {
      id: "3tfVchg6asckjdZzRLEtSRY7L9EXwQjk",
      name: "Jagad",
      email: "jagad@gmail.com",
      image: "/assets/avatar/female/96.png",
      role: "gudang",
      banned: false,
      createdAt: new Date("2026-02-13T09:02:00.029Z"),
    },
    {
      id: "sQr98oJTyHLsLvYy15PXW5sxjf9QTLTe",
      name: "Aan Alma",
      email: "aanalma@gmail.com",
      image: "/assets/avatar/male/13.png",
      role: "produksi",
      banned: false,
      createdAt: new Date("2026-02-13T09:01:27.007Z"),
    },
    {
      id: "DE606LeCej1tynBzkzcCqUkmt7UgZ6fk",
      name: "Fikri Taufiqul Anam",
      email: "fikritaufiqulanam1@gmail.com",
      image: "/assets/avatar/male/36.png",
      role: "admin",
      banned: false,
      createdAt: new Date("2026-02-13T09:01:00.485Z"),
    },
    {
      id: "nrUmAClbtNeN11wWVD9zEEFVo3Xv0iPC",
      name: "Aditia Rizky Utama",
      email: "aditia@gmail.com",
      image: "/assets/avatar/male/13.png",
      role: "designer",
      banned: false,
      createdAt: new Date("2026-02-13T09:00:32.334Z"),
    },
  ];

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

  await seedFinance();
  await seedProduct();

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
