# 📊 Progres Project POS

## ✅ Selesai (Completed)

### Master Data & Sistem

- [x] Manajemen User & Otentikasi
- [x] Manajemen Produk, Kategori, dan Unit (Satuan)
- [x] Manajemen Customer & Supplier
- [x] Manajemen Karyawan

### Produksi & Inventory

- [x] Fitur Manajemen Bahan Baku (Stok, Min Stok)
- [x] Transaksi Penerimaan Barang (CRUD, Duplikat, Rollback Auto-Stok Terintegrasi)
- [x] Halaman SPK (Surat Perintah Kerja) dan Pipeline Tahap Produksi
- [x] Antrean Desain (Design Queue & Design Archive) lengkap dengan upload file

### Transaksi & Pesanan

- [x] Model `Order` & `OrderItem` di Schema
- [x] Halaman Manajemen Pesanan & Status Order
- [x] Pengelolaan Status Pembayaran & Produksi yang tersinkronisasi

### UI/UX & Peningkatan Teknis

- [x] Universal `FilterLanjutan` (Search, Filter, Pagination) di sebagian besar tabel
- [x] Integrasi Object Storage (Neo S3) untuk upload bukti nota dan file desain
- [x] Context Menu (Klik Kanan) & Optimasi UX dengan HeroUI

### Inventory
- [x] Stok Opname, Fungsi: Mengoreksi stok bahan baku yang tidak sesuai dengan fisik.
- [x] Barang Keluar Produksi, Fungsi: Mengurangi stok bahan baku saat produksi dimulai. Admin menginput kain apa yang keluar dan berapa banyak untuk sebuah SPK (Surat Perintah Kerja).
- [x] Fix Pagination barang keluar dan stok opname dan search opname berdasarkan keterangan

### Keuangan & Akuntansi (Finance Core)
- [x] Migrasi Schema Database Finance (Double-Entry Jurnal Umum, KasBank, Tabungan)
- [x] Integrasi API *Payment* ke Saldo Kas & Jurnal Otomatis
- [x] Pembuatan API *Cost* (Pengeluaran) terintegrasi Jurnal Otomatis

---

## 📝 Todo & Pertimbangan Fitur (Selanjutnya)

### Transaksi & Keuangan (Frontend UI)

- [x] **Refaktor UI Kasir (Payment)** — Menambahkan dropdown pilihan `KasBank` saat Checkout/Bayar Order, wajib diisi agar masuk ke akun yang benar.
- [x] **Manajemen Pengeluaran (Cost)** — Membuat UI untuk merekam biaya operasional, memanggil API Cost yang sudah ada.
- [ ] **Manajemen Tabungan** — Membuat UI untuk memindahkan Laba ke Jenis Tabungan khusus.
- [ ] **Detail Riwayat Customer** — Melihat riwayat belanja, total pesanan, pesanan pertama, dan data retensi pelanggan.
- [ ] **Pengurangan Stok Otomatis (Finished Goods)** — Sistem untuk mengurangi stok Produk Jadi ketika pesanan diberikan ke customer.
- [ ] **Hutang / Piutang** — Sistem untuk melacak order dengan status `DP` / `BELUM_BAYAR`, serta tagihan ke supplier.

### Pelaporan (Analytics & Reports)

- [ ] **Halaman Dashboard Utama** — Menampilkan _Summary Cards_ (Penjualan Hari Ini, Total Customer, dll), _Low Stock Alerts_, dan Grafik Pendapatan.
- [ ] **Laporan Penjualan aktual** — Berdasarkan range tanggal dengan fitur Export.
- [ ] **Laporan Laba Rugi** — Menautkan Pendapatan (Omzet) dikurangi pengeluaran (Cost) dan Harga Pokok (HPP) produk.
- [ ] **Pencetakan Bukti Digital** — Generate Invoice POS / Struk order dalam bentuk PDF atau print otomatis.

### Peningkatan Ekstra (Nice-to-Have)

- [ ] **Notifikasi Stok Menipis** — Peringatan global di navbar ketika ada Bahan Baku / Produk di bawah `minStok`.
- [ ] **Halaman Pengaturan Web** — Menyimpan profil bisnis (Logo Toko, Alamat, Info Pajak) untuk lampiran invoice.
- [ ] **Halaman Sampah** — soft delete untuk semua model.
- [ ] **Audit Log Activity** — Merekam aksi pengguna (hapus produk, edit laporan) untuk keamanan admin.

- [ ] **Halaman Piutang** — penambahan fitur pembayaran dan status lunas.

