// Recorta las piezas que usa la página desde assets/.
// El collage original (assets/2.jpeg) mide 1536x1024; de ahí sale el fondo.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('public/img', { recursive: true });

// Fondo: la celda del salón en tonos rosa del collage.
await sharp('assets/2.jpeg')
  .extract({ left: 6, top: 384, width: 536, height: 330 })
  .resize(1600)
  .jpeg({ quality: 78, mozjpeg: true })
  .toFile('public/img/hero.jpg');

// Logo completo sobre negro, sólo optimizado.
await sharp('assets/eventti.jpeg')
  .resize(640)
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile('public/img/logo.jpg');

// Sólo el monograma, para el favicon.
await sharp('assets/eventti.jpeg')
  .extract({ left: 270, top: 90, width: 500, height: 500 })
  .resize(256)
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile('public/img/monograma.jpg');

console.log('ok');
