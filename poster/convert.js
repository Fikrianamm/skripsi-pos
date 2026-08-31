import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.log('Memulai konversi poster.html ke JPG (2000x2000 px)...');

  // Jalankan browser Puppeteer
  const browser = await puppeteer.launch({
    headless: true
  });
  const page = await browser.newPage();

  // Atur resolusi canvas 2000x2000 px
  await page.setViewport({
    width: 2000,
    height: 2000,
    deviceScaleFactor: 1, // Atur ke 2 jika butuh resolusi 4000x4000px
  });

  // Buka file poster.html lokal
  const filePath = `file://${path.join(__dirname, 'poster.html').replace(/\\/g, '/')}`;
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  // Simpan poster ke file JPG
  const outputPath = path.join(__dirname, 'poster-skripsi.jpg');
  await page.screenshot({
    path: outputPath,
    type: 'jpeg',
    quality: 90, // Kualitas JPG (maksimal 100, 90 sudah sangat jernih dan < 5MB)
    fullPage: true,
  });

  console.log(`✅ Poster berhasil disimpan sebagai JPG di: ${outputPath}`);
  await browser.close();
})();
