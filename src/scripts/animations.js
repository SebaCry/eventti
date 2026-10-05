import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Un solo vocabulario de movimiento: entradas largas, curvas que frenan sin rebotar,
// y todo "entra en foco" (de desenfocado a nítido), como la lente del hero.
const EASE = 'power3.out';
const EASE_WIPE = 'power2.inOut';
gsap.defaults({ ease: EASE, duration: 1.2 });

const FOCUS = { y: 26, opacity: 0, filter: 'blur(10px)', duration: 1.3 };

// Reveal de izquierda a derecha. Los dos extremos van explícitos: interpolar hacia
// `none` deja el recorte a medias.
const WIPE_FROM = { clipPath: 'inset(0 100% -20% 0)' };
const WIPE_TO = { clipPath: 'inset(0 -2% -20% 0)' };

/** Parte un texto en <span> por carácter. El texto íntegro queda para lectores de pantalla. */
function splitChars(el) {
  const text = el.textContent.trim();
  el.textContent = '';
  const label = document.createElement('span');
  label.className = 'sr-only';
  label.textContent = text;
  el.appendChild(label);
  return [...text].map((ch) => {
    const span = document.createElement('span');
    span.textContent = ch;
    span.setAttribute('aria-hidden', 'true');
    span.style.display = 'inline-block';
    if (ch === ' ') span.style.width = '0.34em';
    el.appendChild(span);
    return span;
  });
}

/** Prepara un trazo SVG para dibujarse. */
function dashify(path) {
  const len = path.getTotalLength();
  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
}

// ── Header: se compacta al bajar y marca la sección en la que estás ───
// Va fuera de matchMedia: es estado, no adorno, y debe funcionar con movimiento reducido.
const header = document.getElementById('site-header');
ScrollTrigger.create({
  start: 60,
  onToggle: (self) => header?.classList.toggle('is-scrolled', self.isActive),
});

document.querySelectorAll('[data-section]').forEach((link) => {
  const section = document.getElementById(link.dataset.section);
  if (!section) return;
  ScrollTrigger.create({
    trigger: section,
    start: 'top 45%',
    end: 'bottom 45%',
    onToggle: (self) => (self.isActive ? link.setAttribute('aria-current', 'true') : link.removeAttribute('aria-current')),
  });
});

const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: reduce)', () => {
  gsap.set('.will-reveal', { opacity: 1 });
});

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // ── Hero: la lente se abre sobre la fiesta ──────────────────────────
  const hero = document.getElementById('top');
  gsap.utils.toArray('#hero-ring circle').forEach(dashify);
  const letters = splitChars(document.getElementById('hero-line1'));

  gsap
    .timeline()
    // El titular y el párrafo compiten por ser el elemento LCP: transform y blur, nunca opacidad,
    // para que cuenten como pintados desde el primer frame.
    .from(letters, { yPercent: 28, filter: 'blur(9px)', duration: 1.1, stagger: 0.04 }, 0.1)
    .from('#hero-copy', { y: 22, filter: 'blur(8px)', duration: 1.4 }, 0.35)
    .fromTo(hero, { '--lens': 0 }, { '--lens': 1, duration: 2, ease: 'expo.out' }, 0.2)
    .to('#hero-ring circle', { strokeDashoffset: 0, duration: 2.4, stagger: 0.2, ease: EASE_WIPE }, 0.2)
    .fromTo('#hero-script', WIPE_FROM, { ...WIPE_TO, duration: 1.8, ease: EASE_WIPE }, 0.5)
    .to('#hero-facts', { opacity: 1, duration: 1.2 }, 1.3);

  // La lente sigue al cursor, con retardo, sólo con ratón.
  if (matchMedia('(pointer: fine)').matches) {
    const toX = gsap.quickTo(hero, '--mx', { duration: 1.4, ease: 'power3' });
    const toY = gsap.quickTo(hero, '--my', { duration: 1.4, ease: 'power3' });
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      toX(((e.clientX - r.left) / r.width - 0.5) * 70);
      toY(((e.clientY - r.top) / r.height - 0.5) * 50);
    });
    hero.addEventListener('pointerleave', () => {
      toX(0);
      toY(0);
    });
  }

  // Al bajar, la foto se queda atrás y el texto se aleja.
  gsap.to('#hero-media', {
    yPercent: 14,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('#hero-content', {
    y: -60,
    opacity: 0.2,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });

  // ── About ───────────────────────────────────────────────────────────
  gsap.from('#about-media > div:first-child', {
    opacity: 0,
    x: -30,
    filter: 'blur(12px)',
    duration: 1.6,
    scrollTrigger: { trigger: '#about-media', start: 'top 80%' },
  });
  gsap.from('#about-detail', {
    opacity: 0,
    scale: 0.85,
    filter: 'blur(10px)',
    duration: 1.5,
    delay: 0.35,
    scrollTrigger: { trigger: '#about-media', start: 'top 80%' },
  });
  gsap.from('#about-copy > *', {
    ...FOCUS,
    stagger: 0.12,
    scrollTrigger: { trigger: '#about-copy', start: 'top 80%' },
  });
  gsap.fromTo(
    '#about-media img',
    { yPercent: -3 },
    { yPercent: 3, ease: 'none', scrollTrigger: { trigger: '#about-media', start: 'top bottom', end: 'bottom top', scrub: true } },
  );

  // ── Occasions: cada arco entra en foco ──────────────────────────────
  gsap.from('#occ-head > *', {
    ...FOCUS,
    stagger: 0.12,
    scrollTrigger: { trigger: '#occ-head', start: 'top 80%' },
  });
  gsap.from('#occasions .occasion', {
    y: 50,
    opacity: 0,
    filter: 'blur(14px)',
    duration: 1.6,
    stagger: 0.14,
    scrollTrigger: { trigger: '#occasions ul', start: 'top 82%' },
  });

  // ── Rentals: las piezas se posan sobre la línea ─────────────────────
  gsap.utils.toArray('#rentals .item').forEach((item, i) => {
    gsap
      .timeline({ scrollTrigger: { trigger: '#rentals ul', start: 'top 78%' }, delay: i * 0.13 })
      .from(item.querySelector('picture'), { y: -22, opacity: 0, filter: 'blur(10px)', duration: 1.4 })
      .from(item.querySelector('.rule'), { scaleX: 0, duration: 1.1, ease: EASE_WIPE }, '-=1')
      .from(item.querySelectorAll('h3, p'), { ...FOCUS, y: 14, duration: 1, stagger: 0.08 }, '-=0.9');
  });

  // ── Popcorn ─────────────────────────────────────────────────────────
  gsap.fromTo('#popcorn-script', WIPE_FROM, {
    ...WIPE_TO,
    duration: 2,
    ease: EASE_WIPE,
    scrollTrigger: { trigger: '#popcorn-script', start: 'top 82%' },
  });
  gsap.to('#popcorn-copy', { opacity: 1, duration: 1.4, scrollTrigger: { trigger: '#popcorn-script', start: 'top 72%' } });
  gsap.from('#popcorn-media', {
    opacity: 0,
    x: 30,
    filter: 'blur(12px)',
    duration: 1.6,
    scrollTrigger: { trigger: '#popcorn-media', start: 'top 82%' },
  });
  gsap.fromTo(
    '#popcorn-media img',
    { yPercent: 3 },
    { yPercent: -3, ease: 'none', scrollTrigger: { trigger: '#popcorn-media', start: 'top bottom', end: 'bottom top', scrub: true } },
  );

  // ── Packages: pincelada dorada y precios que suben ──────────────────
  gsap.from('#packages .pkg', {
    y: 34,
    opacity: 0,
    filter: 'blur(10px)',
    duration: 1.4,
    stagger: 0.16,
    scrollTrigger: { trigger: '#packages', start: 'top 72%' },
  });
  gsap.from('#packages .brush', {
    scaleX: 0,
    duration: 1.2,
    stagger: 0.16,
    ease: EASE_WIPE,
    scrollTrigger: { trigger: '#packages .brush', start: 'top 88%' },
  });
  gsap.utils.toArray('#packages .price').forEach((el) => {
    const counter = { n: 0 };
    gsap.to(counter, {
      n: Number(el.dataset.to),
      duration: 1.8,
      snap: { n: 1 },
      onUpdate: () => (el.textContent = Math.round(counter.n)),
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });

  // ── Process: la línea avanza con el scroll ──────────────────────────
  gsap.from('#process-track', {
    scaleX: 0,
    ease: 'none',
    scrollTrigger: { trigger: '#process ol', start: 'top 74%', end: 'bottom 70%', scrub: 0.8 },
  });
  gsap.from('#process .dot', {
    scale: 0.8,
    opacity: 0,
    filter: 'blur(8px)',
    duration: 1.2,
    stagger: 0.2,
    scrollTrigger: { trigger: '#process ol', start: 'top 74%' },
  });
  gsap.from('#process .step h3, #process .step p', {
    ...FOCUS,
    y: 16,
    duration: 1.1,
    stagger: 0.09,
    scrollTrigger: { trigger: '#process ol', start: 'top 70%' },
  });

  // ── Contact ─────────────────────────────────────────────────────────
  gsap.fromTo('#contact-script', WIPE_FROM, {
    ...WIPE_TO,
    duration: 2,
    ease: EASE_WIPE,
    scrollTrigger: { trigger: '#contact-script', start: 'top 86%' },
  });
  gsap.from('#contact-phone', {
    opacity: 0,
    filter: 'blur(14px)',
    letterSpacing: '0.32em',
    duration: 1.8,
    scrollTrigger: { trigger: '#contact-phone', start: 'top 90%' },
  });
  ['#curve-a', '#curve-b'].forEach((sel) => {
    const path = document.querySelector(sel);
    if (!path) return;
    dashify(path);
    gsap.to(path, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: { trigger: '#contact', start: 'center bottom', end: 'bottom bottom', scrub: 0.8 },
    });
  });
});
