CARA MENGEDIT TEMPLATE POSTER INI
==================================

1. Buka file "poster.html" dengan text editor (VS Code, Notepad++, dsb),
   atau langsung buka di browser (Chrome/Edge) untuk melihat hasilnya.

2. Semua teks bisa diedit langsung di bagian <body> ... </body>.
   Cari teks yang ingin diubah (misalnya judul, nama, hasil, dsb) lalu ganti.

3. Untuk mengganti gambar screenshot UI:
   - Ganti file di folder "poster_assets/" dengan gambar baru
     (pastikan nama file sama, atau ubah juga src="..." di HTML-nya).

4. Warna, ukuran font, dan jarak antar elemen diatur di bagian <style>
   di awal file. Cari variabel warna di ":root { ... }" untuk ganti
   skema warna dengan cepat.

5. Setelah selesai edit, ekspor ke JPG 2000x2000 px dengan salah satu cara:

   a) Pakai wkhtmltoimage (command line, jika sudah install):
      wkhtmltoimage --enable-local-file-access --width 2000 --height 2000 poster.html poster.png
      lalu convert poster.png ke .jpg dengan aplikasi/editor gambar apapun.

   b) Atau screenshot manual dari browser:
      - Buka poster.html di Chrome
      - Set ukuran browser/zoom agar poster terlihat penuh 1:1
      - Gunakan ekstensi "Full Page Screen Capture" lalu crop ke 2000x2000 px
        di editor gambar (Photoshop, GIMP, Paint.NET, dll).

CATATAN:
- Ukuran kanvas poster sudah diset tepat 2000x2000 px di dalam CSS
  (lihat "html, body { width: 2000px; height: 2000px; }"), jadi jangan
  diubah supaya tetap sesuai ketentuan panduan skripsi.
- Pastikan tidak ada teks yang memakai huruf kapital semua (all caps).
