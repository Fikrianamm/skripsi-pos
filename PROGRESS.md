# 📊 Progres Project POS

## 📝 Todo

### Fitur Utama

- [ ] **Relasi Customer ke Pesanan** — tambah relasi ke model `Order`/transaksi sehingga bisa melihat:
  - Pesanan pertama customer (tanggal + detail)
  - Total jumlah pesanan
  - Total nominal belanja
  - Detail riwayat pesanan per customer
- [ ] Model `Order` / transaksi di Prisma schema
- [ ] Halaman POS — keranjang belanja, pilih customer, checkout, cetak struk
- [ ] Halaman Manajemen inventory — stok masuk/keluar yang terhubung ke transaksi
- [ ] Halaman Laporan penjualan yang sesungguhnya (berdasarkan data transaksi)
- [ ] Halaman Laporan laba rugi (HPP vs harga jual)
- [ ] Halaman Manajemen biaya (Cost & CostCategory sudah ada di schema)

### Peningkatan

- [ ] Filter tanggal di halaman laporan
- [ ] Export laporan ke PDF / Excel
- [ ] Notifikasi stok menipis (stok < minStok)
- [ ] Dashboard — summary card (total customer, produk, penjualan hari ini)
- [ ] Pencarian global
- [ ] Audit log aktivitas pengguna
