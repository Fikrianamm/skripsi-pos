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
- [x] Integrasi API _Payment_ ke Saldo Kas & Jurnal Otomatis
- [x] Pembuatan API _Cost_ (Pengeluaran) terintegrasi Jurnal Otomatis

---

- [x] **Question** — Sebenarnya Payment, Cost, dan CostCategory apakah perlu atau cukup ambil dari jurnal umum saja? YA
- [x] **Halaman Tabungan** — hapus fitur tabungan, karena sudah ada di jurnal umum.
- [x] **Halaman Pengeluaran** — menampilkan pengeluaran berdasarkan tanggal/tahun dan kategori.
- [x] **Halaman Piutang** — penambahan fitur pembayaran dan status lunas.
- [X] **Halaman stok** — penambahan auto menambahkan jurnal umum ketika input barang masuk.
- [X] **Halaman Input Pesanan** — tambahkan auto input ke jurnal umum ketika input pesanan dengan kredit piutang usaha dan debit kas bank.
- [X] **Halaman Pesanan** — bug ketika pelunasan melebihi sisa tagihan masih bisa input lebih.
- [x] **Halaman Input Pembayaran tagihan** — tambahkan validasi agar tidak bisa input nilai lebih dari sisa tagihan yang harus dibayar.
- [x] **Halaman Input Number** — ubah semua input number display value auto format ke format ribuan (contoh: 1000000 -> 1.000.000).
- [x] **Halaman Laporan Neraca** — Recreate UI.
- [x] **Halaman Laporan Laba-rugi** — Recreate UI.
- [x] **Halaman Laporan Tabungan** — Recreate UI.
- [X] **Update Schema** — refactor field jurnalumum, hapus tabel tabungan.
- [x] **Refaktor UI Kasir (Payment)** — Menambahkan dropdown pilihan `KasBank` saat Checkout/Bayar Order, wajib diisi agar masuk ke akun yang benar.
- [x] **Manajemen Pengeluaran (Cost)** — Membuat UI untuk merekam biaya operasional, memanggil API Cost yang sudah ada.
- [X] **Hutang / Piutang** — Sistem untuk melacak order dengan status `DP` / `BELUM_BAYAR`, serta tagihan ke supplier.
- [X] **Table Inventory** — sesuaikan table inventory dengan table lainnya agar sama stylenya.
- [X] **Question** — saya ingin sistem flow harus berjalan sesuai urutan dan harusnya tidak bisa langsung loncat", untuk proses potong, sablon, dan jahit bagaimana kalau dibuat menjadi satu proses yaitu produksi, bagaimana sebaiknya penyesuaian pergantian status ini dan siapa yang pegang kendali.

## 📝 Todo & Pertimbangan Fitur (Selanjutnya)


- [ ] **Detail Riwayat Customer** — Melihat riwayat belanja, total pesanan, pesanan pertama, dan data retensi pelanggan.
- [ ] **Pengurangan Stok Otomatis (Finished Goods)** — Sistem untuk mengurangi stok Produk Jadi ketika pesanan diberikan ke customer.

- [ ] **Halaman Dashboard Utama** — Menampilkan _Summary Cards_ (Penjualan Hari Ini, Total Customer, dll), _Low Stock Alerts_, dan Grafik Pendapatan.
- [ ] **Laporan Penjualan aktual** — Berdasarkan range tanggal dengan fitur Export.
- [ ] **Laporan Laba Rugi** — Menautkan Pendapatan (Omzet) dikurangi pengeluaran (Cost) dan Harga Pokok (HPP) produk.
- [ ] **Pencetakan Bukti Digital** — Generate Invoice POS / Struk order dalam bentuk PDF atau print otomatis.

- [ ] **Pendapatan** — pendapatan masing" nilai pendapatan didapat dari input yang mana? dan apakah benar ketika input pesanan membuat jurnal umum yang kredit dari pendapatan konveksi ke debit piutang usaha?.
- [ ] **Fitur Reversal** — cek fungsi fitur reversal apakah sudah benar.

### Peningkatan Ekstra (Nice-to-Have)

- [ ] **Notifikasi Stok Menipis** — Peringatan global di navbar ketika ada Bahan Baku / Produk di bawah `minStok`.
- [ ] **Halaman Pengaturan Web** — Menyimpan profil bisnis (Logo Toko, Alamat, Info Pajak) untuk lampiran invoice.
- [ ] **Halaman Sampah** — soft delete untuk semua model.
- [ ] **Audit Log Activity** — Merekam aksi pengguna (hapus produk, edit laporan) untuk keamanan admin.

