// Prepara las imágenes de la landing a partir de los originales en assets/.
// Las fotos salen de eventti-presentacion.pdf y llegan a baja resolución, así que
// se reescalan con lanczos3 y un unsharp suave para que aguanten pantallas 2x.
// Más de ~2.2x del original ya no aporta detalle, sólo peso.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'assets';
const OUT = 'public/img';
mkdirSync(OUT, { recursive: true });

// [origen, destino, ancho de salida]
const PHOTOS = [
  ['hero-table.png', 'hero-table', 1250],
  ['about-arch.png', 'about-arch', 1500],
  ['popcorn-cart.png', 'popcorn-cart', 1300],
  ['pkg-basic.png', 'pkg-basic', 800],
  ['pkg-celebration.png', 'pkg-celebration', 800],
  ['pkg-complete.png', 'pkg-complete', 800],
];

// Productos: vienen recortados sobre un fondo casi blanco que, sobre el crema,
// se ve como un recuadro. Se pasa a transparencia.
const PRODUCTS = [
  ['item-chair.png', 'item-chair', 450],
  ['item-table.png', 'item-table', 850],
  ['item-linens.png', 'item-linens', 680],
  ['item-popcorn.png', 'item-popcorn', 430],
  ['item-decor.png', 'item-decor', 570],
];

/** Reescala con lanczos3 y recupera definición con un unsharp discreto. */
function upscale(input, width) {
  return sharp(input)
    .resize({ width, kernel: 'lanczos3' })
    .sharpen({ sigma: 0.7, m1: 0.4, m2: 0.9 });
}

/** Vuelve transparente el fondo claro y uniforme, con un borde degradado para no dentar. */
async function cutout(input, width) {
  const { data, info } = await upscale(input, width)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const OPAQUE = 232; // por debajo de esto el pixel es objeto
  const CLEAR = 248; // por encima es fondo

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const min = Math.min(r, g, b);
    // Sólo toca grises claros: si hay color, es parte del objeto.
    if (Math.max(r, g, b) - min > 12) continue;
    if (min >= CLEAR) data[i + 3] = 0;
    else if (min > OPAQUE) data[i + 3] = Math.round(255 * ((CLEAR - min) / (CLEAR - OPAQUE)));
  }

  return sharp(data, { raw: info });
}

for (const [src, name, width] of PHOTOS) {
  const img = upscale(`${SRC}/${src}`, width);
  await img.clone().webp({ quality: 88, effort: 6 }).toFile(`${OUT}/${name}.webp`);
  await img.clone().jpeg({ quality: 86, mozjpeg: true }).toFile(`${OUT}/${name}.jpg`);
}

for (const [src, name, width] of PRODUCTS) {
  const img = await cutout(`${SRC}/${src}`, width);
  await img.clone().webp({ quality: 90, effort: 6 }).toFile(`${OUT}/${name}.webp`);
  // El PNG sólo lo ven navegadores sin WebP: paleta en vez de color real.
  await img.clone().png({ palette: true, quality: 85, compressionLevel: 9 }).toFile(`${OUT}/${name}.png`);
}

// Logo completo sobre negro y monograma suelto para el favicon.
await sharp(`${SRC}/eventti.jpeg`).resize(700).webp({ quality: 92, effort: 6 }).toFile(`${OUT}/logo.webp`);
await sharp(`${SRC}/eventti.jpeg`)
  .extract({ left: 270, top: 90, width: 500, height: 500 })
  .resize(96)
  .png({ palette: true, compressionLevel: 9 })
  .toFile(`${OUT}/monogram.png`);

console.log('images ok');
