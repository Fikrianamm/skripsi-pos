# 📊 Progres Project POS

# notifikasi role

src/app/api/order/route.ts → POST (order baru): kirim ke admin + kasir
src/app/api/order/[id]/route.ts → PATCH (status berubah): kirim ke admin
src/app/api/order/[id]/payment/route.ts → POST (pembayaran): kirim ke admin
src/app/api/finance/cost/route.ts → POST (biaya): kirim ke admin
src/app/api/admin/inventory/in/route.ts → POST (penerimaan): kirim ke admin + gudang

## 📝 Todo & Pertimbangan Fitur (Selanjutnya)

- [ ] **update layout invoice view** —
- [ ] **header title** — tambahkan semua halaman title yang sesuai
- [ ] **tampilan sampah** — tambahkan filter untuk menampilkan semua sampah dan bisa klik detail untuk melihat detail dengan memunculkan modal
- [ ] **Laporan Laba Rugi** — Menautkan Pendapatan (Omzet) dikurangi pengeluaran (Cost) dan Harga Pokok (HPP) produk.

### Peningkatan Ekstra (Nice-to-Have)

- [ ] **Halaman Sampah** — soft delete untuk semua model.
- [ ] **Audit Log Activity** — Merekam aksi pengguna (hapus produk, edit laporan) untuk keamanan admin.
