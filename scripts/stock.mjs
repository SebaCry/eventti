// Descarga las fotos de stock a assets/stock y escribe sus créditos.
//
// Todas son de Unsplash con licencia gratuita (no Unsplash+): uso comercial permitido,
// atribución no obligatoria. Se dejan los créditos en assets/stock/CREDITS.md igualmente.
// Sólo hace falta volver a ejecutarlo si se cambia alguna foto.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const OUT = 'assets/stock';
mkdirSync(OUT, { recursive: true });

// nombre: [id de Unsplash, id de la imagen en el CDN, autor, ancho a descargar]
const PHOTOS = {
  'hero': ['fb0_wj2MZk4', 'photo-1536392706976-e486e2ba97af', 'M F', 4000],
  'about-table': ['7jgtAhJkjwk', 'photo-1561593367-66c79c2294e6', 'Cody Chan', 2400],
  'about-detail': ['wuZnwi-rEaQ', 'photo-1613067532295-b4f1760616cd', 'Chasse Sauvage', 1600],
  'occ-birthday': ['D31ZvQgI9z8', 'photo-1741969494307-55394e3e4071', 'Onkar Singh', 2600],
  'occ-quince': ['htSJ58QDqiU', 'photo-1759124649699-010eeb1f69f8', 'Michael Kyule', 2600],
  'occ-corporate': ['j1EOu_UnXNs', 'photo-1775476793931-cb484f197760', 'Jacques Dillies', 2600],
  'occ-family': ['qSWpTzl0too', 'photo-1782038523014-831222a83f32', 'Volodymyr Lymariev', 2600],
  'occ-more': ['8hrJdJhGtO0', 'photo-1780586382591-0abc6b78d1f1', 'Jonathan Borba', 2600],
  'popcorn-cart': ['l7n8RON8EUI', 'photo-1605713669511-922bb8f08840', 'Bastien Nvs', 2000],
  'pkg-basic': ['lHe6K8VieGc', 'photo-1597451828211-09604cfa296a', 'Rolla Ru', 2000],
  'pkg-celebration': ['Rvcoj37acS0', 'photo-1766719628920-854680a92c22', 'Carlos Barcia', 2000],
  'pkg-complete': ['7PuxGo267Bw', 'photo-1762216444265-a675abbb48dd', 'Malia Moore', 2000],
  'contact-bg': ['0hAdietsUrE', 'photo-1562050344-f7ad946cee35', 'Nadia Valko', 2600],
};

const credits = ['# Créditos de fotos', '', 'Fotos de [Unsplash](https://unsplash.com/license), licencia gratuita.', ''];

for (const [name, [id, cdn, author, w]] of Object.entries(PHOTOS)) {
  const file = `${OUT}/${name}.jpg`;
  if (!existsSync(file)) {
    execFileSync('curl.exe', ['-s', '-f', '-o', file, `https://images.unsplash.com/${cdn}?w=${w}&q=90&fm=jpg`]);
  }
  credits.push(`- \`${name}\`: ${author}, https://unsplash.com/photos/${id}`);
  console.log(`${name} ok`);
}

writeFileSync(`${OUT}/CREDITS.md`, credits.join('\n') + '\n');
