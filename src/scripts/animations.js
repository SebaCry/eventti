import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Un solo vocabulario de movimiento para toda la página: entradas largas,
// curvas que frenan sin rebotar, y desenfoque en lugar de desplazamientos amplios.
const EASE = 'power3.out';
const EASE_WIPE = 'power2.inOut';

gsap.defaults({ ease: EASE, duration: 1.2 });

/** Entrada por defecto: el texto se posa y enfoca. */
const SETTLE = { y: 26, opacity: 0, filter: 'blur(10px)', duration: 1.3, ease: EASE };

// Reveal de izquierda a derecha. Los dos extremos van explícitos: interpolar
// hacia `none` deja el recorte a medias.
const WIPE_FROM = { clipPath: 'inset(0 100% -20% 0)' };
const WIPE_TO = { clipPath: 'inset(0 -2% -20% 0)' };

/** Parte un texto en <span> por carácter para poder escalonarlo.
 *  El texto íntegro queda en un span sólo para lectores de pantalla. */
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
    span.style.willChange = 'transform, filter';
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

/** La barra superior aparece cuando el hero sale de pantalla. */
function stickyBar() {
  const bar = document.getElementById('bar');
  if (!bar) return;

  ScrollTrigger.create({
    trigger: '#top',
    start: 'bottom 10%',
    onEnter: () => {
      bar.classList.remove('hidden');
      bar.classList.add('animated', 'fadeInDown');
    },
    onLeaveBack: () => {
      bar.classList.add('hidden');
      bar.classList.remove('animated', 'fadeInDown');
    },
  });
}

stickyBar();

const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: reduce)', () => {
  gsap.set('.will-reveal', { opacity: 1 });
});

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // ── Hero: una sola secuencia al cargar ──────────────────────────────
  gsap.utils.toArray('#hero-rings circle').forEach(dashify);
  const letters = splitChars(document.getElementById('hero-line1'));

  const intro = gsap.timeline({ defaults: { ease: EASE } });

  // El titular se asienta pronto a propósito: es el elemento LCP de la página.
  intro
    .to('#hero-logo', { opacity: 1, duration: 1.1 })
    .from('#hero-logo', { y: 16, scale: 0.97, filter: 'blur(6px)', duration: 1.4 }, 0)
    // Las versales se enfocan una a una, sin saltos. No animan la opacidad:
    // el titular es el elemento LCP y debe contar como pintado en el primer frame.
    .from(letters, { yPercent: 28, filter: 'blur(9px)', duration: 1.1, stagger: 0.04 }, 0.1)
    .to('#hero-rings circle', { strokeDashoffset: 0, duration: 2.4, stagger: 0.18, ease: EASE_WIPE }, 0.1)
    .from('#hero-photo', { clipPath: 'circle(0% at 50% 50%)', duration: 1.6, ease: EASE_WIPE }, 0.25)
    .from('#hero-photo picture img', { scale: 1.25, duration: 2.6 }, 0.25)
    // El momento de la página: la caligrafía se descubre como si se escribiera.
    .fromTo('#hero-script', WIPE_FROM, { ...WIPE_TO, duration: 1.8, ease: EASE_WIPE }, 0.5)
    .to('#hero-copy', { opacity: 1, duration: 1.2 }, 1)
    .from('#hero-copy', { y: 22, filter: 'blur(6px)', duration: 1.3 }, 1);

  // ── About: la foto se asoma con el scroll ───────────────────────────
  gsap.from('#about-photo', {
    opacity: 0,
    x: -32,
    filter: 'blur(12px)',
    duration: 1.6,
    scrollTrigger: { trigger: '#about-photo', start: 'top 82%' },
  });

  gsap.from('#about-copy > *', {
    ...SETTLE,
    stagger: 0.12,
    scrollTrigger: { trigger: '#about-copy', start: 'top 80%' },
  });

  gsap.fromTo(
    '#about-photo img',
    { yPercent: -3 },
    {
      yPercent: 3,
      ease: 'none',
      scrollTrigger: { trigger: '#about-photo', start: 'top bottom', end: 'bottom top', scrub: true },
    },
  );

  // ── Occasions: se dibuja el aro y aparece la marca dentro ───────────
  gsap.utils.toArray('#occasions .occasion').forEach((item, i) => {
    const circle = item.querySelector('.ring circle');
    dashify(circle);

    gsap
      .timeline({ scrollTrigger: { trigger: '#occasions ul', start: 'top 80%' }, delay: i * 0.16 })
      .to(circle, { strokeDashoffset: 0, duration: 1.6, ease: EASE_WIPE })
      .from(item.querySelector('.mark'), { scale: 0.86, opacity: 0, filter: 'blur(8px)', duration: 1.1 }, '-=1.15')
      .from(item.querySelectorAll('h3, p'), { ...SETTLE, y: 16, duration: 1, stagger: 0.1 }, '-=0.85');
  });

  // ── Inventory: las piezas se posan sobre la línea ───────────────────
  gsap.utils.toArray('#inventory .item').forEach((item, i) => {
    gsap
      .timeline({ scrollTrigger: { trigger: '#inventory ul', start: 'top 78%' }, delay: i * 0.13 })
      .from(item.querySelector('picture'), { y: -22, opacity: 0, filter: 'blur(10px)', duration: 1.4 })
      .from(item.querySelector('.rule'), { scaleX: 0, duration: 1.1, ease: EASE_WIPE }, '-=1')
      .from(item.querySelectorAll('h3, p'), { ...SETTLE, y: 14, duration: 1, stagger: 0.08 }, '-=0.9');
  });

  // ── Popcorn: misma caligrafía descubierta, y parallax del carrito ───
  gsap.fromTo('#popcorn-script', WIPE_FROM, {
    ...WIPE_TO,
    duration: 2,
    ease: EASE_WIPE,
    scrollTrigger: { trigger: '#popcorn-script', start: 'top 82%' },
  });

  gsap.to('#popcorn-copy', {
    opacity: 1,
    duration: 1.4,
    scrollTrigger: { trigger: '#popcorn-script', start: 'top 72%' },
  });

  gsap.from('#popcorn-photo', {
    opacity: 0,
    x: 32,
    filter: 'blur(12px)',
    duration: 1.6,
    scrollTrigger: { trigger: '#popcorn-photo', start: 'top 82%' },
  });

  gsap.fromTo(
    '#popcorn-photo img',
    { yPercent: 3 },
    {
      yPercent: -3,
      ease: 'none',
      scrollTrigger: { trigger: '#popcorn-photo', start: 'top bottom', end: 'bottom top', scrub: true },
    },
  );

  // ── Packages: brochazo dorado y precios que suben ───────────────────
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
    const to = Number(el.dataset.to);
    const counter = { n: 0 };
    gsap.to(counter, {
      n: to,
      duration: 1.8,
      ease: EASE,
      snap: { n: 1 },
      onUpdate: () => (el.textContent = Math.round(counter.n)),
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });

  // ── Process: la línea avanza con el scroll y enciende cada paso ─────
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
    ...SETTLE,
    y: 16,
    duration: 1.1,
    stagger: 0.09,
    scrollTrigger: { trigger: '#process ol', start: 'top 70%' },
  });

  // ── Contact: el teléfono se planta y la curva se dibuja ─────────────
  gsap.fromTo('#contact-script', WIPE_FROM, {
    ...WIPE_TO,
    duration: 2,
    ease: EASE_WIPE,
    scrollTrigger: { trigger: '#contact-script', start: 'top 86%' },
  });

  gsap.from('#contact-phone', {
    opacity: 0,
    filter: 'blur(14px)',
    letterSpacing: '0.3em',
    duration: 1.8,
    scrollTrigger: { trigger: '#contact-phone', start: 'top 90%' },
  });

  ['#curve-a', '#curve-b'].forEach((sel, i) => {
    const path = document.querySelector(sel);
    if (!path) return;
    dashify(path);
    gsap.to(path, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: { trigger: '#contact', start: 'center bottom', end: 'bottom bottom', scrub: 0.8 },
      delay: i * 0.1,
    });
  });
});
