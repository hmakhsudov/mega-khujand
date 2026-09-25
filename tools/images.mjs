// Пересобирает media/opt/: AVIF и WebP в трёх ширинах + JPG-запасной.
// Запуск из корня репозитория: npm i --no-save sharp && node tools/images.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'media/opt');
fs.mkdirSync(OUT, { recursive: true });

const renders = fs.readdirSync(path.join(ROOT, 'media/renders')).filter(f => f.endsWith('.jpg'));
// стоковые фото — только иллюстрации, на сайте подписаны «Фото для примера»
const stock = ['courtyard-sports-aerial.jpg', 'rooftop-terrace-aerial.jpg', 'aerial-river-daytime.jpg'];
const jobs = [
  ...renders.map(f => ({ src: path.join(ROOT, 'media/renders', f), widths: [640, 1280, 1920] })),
  ...stock.map(f => ({ src: path.join(ROOT, 'media', f), widths: [480, 800, 1080] }))
];

for (const j of jobs) {
  const base = path.basename(j.src, '.jpg');
  for (const w of j.widths) {
    const img = () => sharp(j.src).resize({ width: w, withoutEnlargement: true });
    await img().avif({ quality: w >= 1900 ? 50 : 52, effort: 6 }).toFile(path.join(OUT, `${base}-${w}.avif`));
    await img().webp({ quality: 74, effort: 5 }).toFile(path.join(OUT, `${base}-${w}.webp`));
  }
  await sharp(j.src).resize({ width: j.widths[1] }).jpeg({ quality: 76, mozjpeg: true, progressive: true })
    .toFile(path.join(OUT, `${base}-${j.widths[1]}.jpg`));
  console.log('✓', base);
}
// facade-3d-poster-* — снимок самой 3D-модели (facade-3d.html), пересобирается вручную
