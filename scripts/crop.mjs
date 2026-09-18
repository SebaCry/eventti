// Corta el collage assets/2.jpeg en celdas sueltas para la galería.
// Coordenadas medidas a ojo sobre el original de 1536x1024.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const CELLS = {
  'mesa-jardin': [0, 0, 548, 370],
  'backdrop-globos': [556, 0, 434, 370],
  'mesa-salvia': [998, 0, 538, 370],
  'salon-rosa': [0, 378, 548, 342],
  'centro-flores': [998, 378, 538, 342],
  'maquina-popcorn': [556, 378, 434, 646],
  'camino-eucalipto': [0, 728, 548, 296],
  'montaje-dorado': [998, 728, 538, 296],
};

mkdirSync('public/img', { recursive: true });

for (const [name, [left, top, width, height]] of Object.entries(CELLS)) {
  await sharp('assets/2.jpeg')
    // 6px hacia dentro para comerse el borde blanco entre celdas
    .extract({ left: left + 6, top: top + 6, width: width - 12, height: height - 12 })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`public/img/${name}.jpg`);
}

// Logo sobre negro -> se usa tal cual, sólo optimizado.
await sharp('assets/eventti.jpeg')
  .resize(640)
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile('public/img/logo.jpg');

// Sólo el monograma, para el nav y el favicon.
await sharp('assets/eventti.jpeg')
  .extract({ left: 270, top: 90, width: 500, height: 500 })
  .resize(256)
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile('public/img/monograma.jpg');

console.log('ok');
