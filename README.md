# 🚀 Point of Sales (POS) & Finance System

Sistem Manajemen POS dan Keuangan terintegrasi yang dibangun dengan **Next.js 16**, **Prisma ORM**, dan **Better Auth**. Dirancang untuk efisiensi operasional dengan fitur real-time dan laporan keuangan standar akuntansi.

## ✨ Fitur Utama

- 🛒 **Point of Sales (POS)** — Transaksi penjualan cepat dengan dukungan cetak invoice.
- 📊 **Dashboard Analytics** — Visualisasi tren penjualan mingguan/bulanan.
- 💰 **Manajemen Keuangan** — Laporan Neraca, Laba Rugi, Tabungan, Pengeluaran, dan Piutang yang terintegrasi.
- 🔐 **Better Auth & RBAC** — 5 Role (Admin, Kasir, Designer, Produksi, Gudang) dengan izin akses granular.
- 📡 **Real-time Notifications** — Integrasi Soketi/Pusher untuk update status pesanan dan desain.
- ☁️ **Cloud Storage** — Upload aset (produk, bukti bayar) ke Biznet Neo Object Storage (S3 Compatible).
- 🗄️ **Database MySQL** — Manajemen data yang handal dengan Prisma ORM.
- 🎨 **Modern UI** — Antarmuka responsif menggunakan Tailwind CSS 4, HeroUI, dan Radix UI.

## 🎯 Tech Stack

| Kategori      | Teknologi              |
| ------------- | ----------------------- |
| **Framework** | Next.js 16 (App Router) |
| **Database**  | MySQL 8.0+              |
| **ORM**       | Prisma ORM              |
| **Auth**      | Better Auth             |
| **Real-time** | Soketi / Pusher         |
| **Storage**   | Neo S3 (Biznet Gio)     |
| **Styling**   | Tailwind CSS 4          |
| **UI Component**| HeroUI, Radix UI      |

## 📦 Persiapan Cepat

### Prasyarat

- Node.js 18.x+
- MySQL 8.0+
- S3 Bucket (untuk fitur upload)

### Instalasi

```bash
# 1. Clone repository
git clone <repo-url>
cd POS

# 2. Install dependencies
npm install

# 3. Setup .env
cp .env.example .env
# Isi DATABASE_URL dan konfigurasi S3/Pusher

# 4. Generate Auth Secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Masukkan output ke BETTER_AUTH_SECRET di .env

# 5. Sinkronisasi Database
npx prisma migrate dev
npx prisma db seed

# 6. Jalankan Server
npm run dev
```

## 🎭 Role & Akses

| Role       | Fokus Utama                                |
| ---------- | ------------------------------------------ |
| `admin`    | Kendali penuh, User Management, Laporan Keuangan |
| `kasir`    | Input Order, Pembayaran, Pelanggan         |
| `designer` | Manajemen Antrian Desain & Upload File     |
| `produksi` | Update Status Produksi & Tracking          |
| `gudang`   | Inventori Stok Bahan Baku                  |

## 🔐 Variabel Lingkungan (.env)

Aplikasi menggunakan konfigurasi terpusat untuk kemudahan deployment:

```env
# DATABASE
DATABASE_URL="mysql://root:pass@localhost:3306/pos_db"

# AUTH
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"

# S3 (Biznet Neo)
NEO_S3_ACCESS_KEY="..."
NEO_S3_SECRET_KEY="..."
NEO_S3_BUCKET="..."
NEO_S3_ENDPOINT="..."

# SOKETI / PUSHER (Shared Client & Server)
PUSHER_APP_ID="pos-app"
PUSHER_SECRET="..."
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_HOST="localhost"
NEXT_PUBLIC_PUSHER_PORT=6001
NEXT_PUBLIC_PUSHER_SCHEME="http"
```

## 🚀 Deployment (Docker)

Tersedia `Dockerfile` dan `docker-compose.yml` untuk deployment menggunakan container:

```bash
docker-compose up -d --build
```

---

**Dibuat untuk mempercepat operasional bisnis Anda.** 🚀

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Better Auth](https://better-auth.com/)
- [Prisma ORM](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [HeroUI](https://heroui.com/)
- [Radix UI](https://www.radix-ui.com/)

---

**Made with ❤️ for developers who want to start fast**
