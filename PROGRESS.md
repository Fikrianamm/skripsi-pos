# 📊 Progres Project POS

# notifikasi role
src/app/api/order/route.ts → POST (order baru): kirim ke admin + kasir
src/app/api/order/[id]/route.ts → PATCH (status berubah): kirim ke admin
src/app/api/order/[id]/payment/route.ts → POST (pembayaran): kirim ke admin
src/app/api/finance/cost/route.ts → POST (biaya): kirim ke admin
src/app/api/admin/inventory/in/route.ts → POST (penerimaan): kirim ke admin + gudang

## 📝 Todo & Pertimbangan Fitur (Selanjutnya)

- [ ] **Banner Low Stock** — saya ingin banner low stock juga untuk produk.
- [ ] **Pesanan** — delete pesanan ubah dengan modal.
- [ ] **Tabel Jurnal Umum** — tampilkan data terkait yang memiliki relasi jadi bisa langsung klik link ke data tersebut.
- [ ] **Pencetakan Bukti Digital** — Generate Invoice POS / Struk order dalam bentuk PDF atau print otomatis.
- [ ] **Laporan Laba Rugi** — Menautkan Pendapatan (Omzet) dikurangi pengeluaran (Cost) dan Harga Pokok (HPP) produk.
- [ ] **filter get kasbank diweb setting berdasarkan jenisRekening "bank" saja** — filter get kasbank diweb setting berdasarkan jenis "bank".

### Peningkatan Ekstra (Nice-to-Have)

- [ ] **Notifikasi Stok Menipis** — Peringatan global di navbar ketika ada Bahan Baku / Produk di bawah `minStok`.
- [ ] **Halaman Sampah** — soft delete untuk semua model.
- [ ] **Audit Log Activity** — Merekam aksi pengguna (hapus produk, edit laporan) untuk keamanan admin.
