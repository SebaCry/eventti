// Genera las imágenes de la web a partir de los originales.
//
// - Fotos: assets/stock, de Unsplash en alta resolución (las descarga scripts/stock.mjs).
// - Productos: assets/hd, el inventario real de eventti-presentacion.pdf. El PDF los trae
//   diminutos, así que se reescalaron 4x con Real-ESRGAN (realesrgan-x4plus), una sola vez
//   y fuera del build.
//
// Cada imagen sale en varios anchos y en AVIF + WebP + JPG/PNG, y se anota en
// src/data/images.json para que <Photo> construya el srcset y reserve el alto.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

const STOCK = 'assets/stock';
const HD = 'assets/hd';
const OUT = 'public/img';
mkdirSync(OUT, { recursive: true });
mkdirSync('src/data', { recursive: true });

// nombre en la web: [original en assets/stock, anchos a generar]
const PHOTOS = {
  // Se pinta más ancha que la pantalla (145 % en escritorio, ~1.9x el alto en móvil).
  'hero': ['hero.jpg', [1200, 2000, 2800, 4000]],
  'about-table': ['about-table.jpg', [560, 900, 1300]],
  'about-detail': ['about-detail.jpg', [320, 640]],
  'popcorn-cart': ['popcorn-cart.jpg', [560, 900, 1300]],
  'occ-birthday': ['occ-birthday.jpg', [400, 720]],
  'occ-quince': ['occ-quince.jpg', [400, 720]],
  'occ-corporate': ['occ-corporate.jpg', [400, 720]],
  'occ-family': ['occ-family.jpg', [400, 720]],
  'occ-more': ['occ-more.jpg', [400, 720]],
  'pkg-basic': ['pkg-basic.jpg', [480, 860]],
  'pkg-celebration': ['pkg-celebration.jpg', [480, 860]],
  'pkg-complete': ['pkg-complete.jpg', [480, 860]],
  'contact-bg': ['contact-bg.jpg', [960, 1800]],
};

// Productos recortados: el fondo casi blanco pasa a transparencia.
const PRODUCTS = {
  'item-chair': ['item-chair.png', [300, 600]],
  'item-table': ['item-table.png', [420, 840]],
  'item-linens': ['item-linens.png', [360, 720]],
  'item-popcorn': ['item-popcorn.png', [260, 520]],
  'item-decor': ['item-decor.png', [320, 640]],
};

const manifest = {};

/** Codifica un original en todos los anchos y formatos. */
async function emit(name, source, widths, alpha) {
  const { width, height } = await source().metadata();
  for (const w of widths) {
    const img = source().resize({ width: w, withoutEnlargement: true });
    await img.clone().avif({ quality: 55, effort: 4 }).toFile(`${OUT}/${name}-${w}.avif`);
    await img.clone().webp({ quality: 80, effort: 5 }).toFile(`${OUT}/${name}-${w}.webp`);
    if (alpha) await img.clone().png({ palette: true, quality: 88, compressionLevel: 9 }).toFile(`${OUT}/${name}-${w}.png`);
    else await img.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(`${OUT}/${name}-${w}.jpg`);
  }
  manifest[name] = { width, height, widths, alpha };
}

/** Vuelve transparente un fondo claro y uniforme, con borde degradado para no dentar. */
async function cutout(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const OPAQUE = 232; // por debajo, objeto
  const CLEAR = 248; // por encima, fondo
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const min = Math.min(r, g, b);
    if (Math.max(r, g, b) - min > 12) continue; // con color: es objeto
    if (min >= CLEAR) data[i + 3] = 0;
    else if (min > OPAQUE) data[i + 3] = Math.round((255 * (CLEAR - min)) / (CLEAR - OPAQUE));
  }
  return () => sharp(data, { raw: info });
}

/** Saca el logo dorado de su fondo negro: lo inverso a un "screen". Sobre cualquier
 *  fondo se compone igual que el original sobre negro, sin el recuadro. */
async function unscreen(input, extract, width, name) {
  let img = sharp(input);
  if (extract) img = img.extract(extract);
  const { data, info } = await img.resize(width).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const a = Math.max(r, g, b);
    if (a <= 14) continue; // el negro del JPEG nunca es 0 exacto
    out[j] = Math.min(255, Math.round((r * 255) / a));
    out[j + 1] = Math.min(255, Math.round((g * 255) / a));
    out[j + 2] = Math.min(255, Math.round((b * 255) / a));
    out[j + 3] = a;
  }
  const result = sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } });
  await result.clone().webp({ quality: 90, alphaQuality: 100 }).toFile(`${OUT}/${name}.webp`);
  await result.clone().png({ compressionLevel: 9 }).toFile(`${OUT}/${name}.png`);
}

for (const [name, [file, widths]] of Object.entries(PHOTOS)) {
  await emit(name, () => sharp(`${STOCK}/${file}`), widths, false);
}

for (const [name, [file, widths]] of Object.entries(PRODUCTS)) {
  await emit(name, await cutout(`${HD}/${file}`), widths, true);
}

await unscreen('assets/eventti.jpeg', null, 520, 'logo');
await unscreen('assets/eventti.jpeg', { left: 270, top: 90, width: 500, height: 500 }, 160, 'monogram');

// Favicon: el monograma sobre su negro, que en la pestaña se lee mejor.
await sharp('assets/eventti.jpeg')
  .extract({ left: 270, top: 90, width: 500, height: 500 })
  .resize(96)
  .png({ palette: true, compressionLevel: 9 })
  .toFile(`${OUT}/favicon.png`);

writeFileSync('src/data/images.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`images ok: ${Object.keys(manifest).length} sets`);
