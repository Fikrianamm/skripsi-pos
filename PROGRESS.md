# 📊 Progres Project POS

# notifikasi role

src/app/api/order/route.ts → POST (order baru): kirim ke admin + kasir
src/app/api/order/[id]/route.ts → PATCH (status berubah): kirim ke admin
src/app/api/order/[id]/payment/route.ts → POST (pembayaran): kirim ke admin
src/app/api/finance/cost/route.ts → POST (biaya): kirim ke admin
src/app/api/admin/inventory/in/route.ts → POST (penerimaan): kirim ke admin + gudang

## 📝 Todo & Pertimbangan Fitur (Selanjutnya)

- [ ] **Laporan Laba Rugi** — Menautkan Pendapatan (Omzet) dikurangi pengeluaran (Cost) dan Harga Pokok (HPP) produk.
- [ ] **Invoice** — Tambahkan status bayar dan sisa pembayaran jika status belum lunas (dp).
