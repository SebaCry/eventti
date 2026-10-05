import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
    span.style.willChange = 'transform';
    if (ch === ' ') span.style.width = '0.28em';
    el.appendChild(span);
    return span;
  });
}

// Reveal de izquierda a derecha. Los dos extremos van explícitos: interpolar
// hacia `none` deja el recorte a medias.
const WIPE_FROM = { clipPath: 'inset(0 100% -20% 0)' };
const WIPE_TO = { clipPath: 'inset(0 -2% -20% 0)' };

/** Prepara un trazo SVG para dibujarse y devuelve su longitud. */
function dashify(path) {
  const len = path.getTotalLength();
  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
  return len;
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
      bar.classList.add('animated', 'fadeInDown', 'faster');
    },
    onLeaveBack: () => {
      bar.classList.add('hidden');
      bar.classList.remove('animated', 'fadeInDown', 'faster');
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

  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // El titular se asienta pronto a propósito: es el elemento LCP de la página.
  intro
    .to('#hero-logo', { opacity: 1, duration: 0.5 })
    .from('#hero-logo', { y: 14, scale: 0.96, duration: 0.5 }, 0)
    .from(letters, { yPercent: 115, duration: 0.45, stagger: 0.022 }, 0.08)
    .to('#hero-rings circle', { strokeDashoffset: 0, duration: 1.4, stagger: 0.1 }, 0.1)
    .from('#hero-photo', { clipPath: 'circle(0% at 50% 50%)', duration: 0.9 }, 0.2)
    .from('#hero-photo picture img', { scale: 1.3, duration: 1.4 }, 0.2)
    // El momento de la página: la caligrafía se descubre como si se escribiera.
    .fromTo('#hero-script', WIPE_FROM, { ...WIPE_TO, duration: 0.95, ease: 'power2.inOut' }, 0.45)
    .to('#hero-copy', { opacity: 1, duration: 0.6 }, 0.7)
    .from('#hero-copy', { y: 20, duration: 0.6 }, 0.7);

  // ── About: la foto se asoma con el scroll ───────────────────────────
  gsap.from('#about-photo', {
    opacity: 0,
    x: -40,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: { trigger: '#about-photo', start: 'top 80%' },
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
      .timeline({ scrollTrigger: { trigger: '#occasions ul', start: 'top 78%' }, delay: i * 0.12 })
      .to(circle, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' })
      .from(item.querySelector('.mark'), { scale: 0.4, opacity: 0, duration: 0.5, ease: 'back.out(2)' }, '-=0.45')
      .from(item.querySelectorAll('h3, p'), { y: 12, opacity: 0, duration: 0.4, stagger: 0.08 }, '-=0.3');
  });

  // ── Inventory: las piezas se posan sobre la línea ───────────────────
  gsap.utils.toArray('#inventory .item').forEach((item, i) => {
    gsap
      .timeline({ scrollTrigger: { trigger: '#inventory ul', start: 'top 75%' }, delay: i * 0.1 })
      .from(item.querySelector('picture'), { y: -36, opacity: 0, duration: 0.7, ease: 'back.out(1.4)' })
      .from(item.querySelector('.rule'), { scaleX: 0, duration: 0.5, ease: 'power2.out' }, '-=0.35')
      .from(item.querySelectorAll('h3, p'), { opacity: 0, duration: 0.4, stagger: 0.06 }, '-=0.3');
  });

  // ── Popcorn: misma caligrafía descubierta, y parallax del carrito ───
  gsap.fromTo('#popcorn-script', WIPE_FROM, {
    ...WIPE_TO,
    duration: 1.2,
    ease: 'power2.inOut',
    scrollTrigger: { trigger: '#popcorn-script', start: 'top 80%' },
  });

  gsap.to('#popcorn-copy', {
    opacity: 1,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: { trigger: '#popcorn-script', start: 'top 70%' },
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
    y: 40,
    opacity: 0,
    duration: 0.7,
    stagger: 0.14,
    ease: 'power3.out',
    scrollTrigger: { trigger: '#packages', start: 'top 70%' },
  });

  gsap.from('#packages .brush', {
    scaleX: 0,
    duration: 0.6,
    stagger: 0.14,
    ease: 'power2.out',
    scrollTrigger: { trigger: '#packages .brush', start: 'top 85%' },
  });

  gsap.utils.toArray('#packages .price').forEach((el) => {
    const to = Number(el.dataset.to);
    const counter = { n: 0 };
    gsap.to(counter, {
      n: to,
      duration: 1.1,
      ease: 'power2.out',
      snap: { n: 1 },
      onUpdate: () => (el.textContent = Math.round(counter.n)),
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });

  // ── Process: la línea avanza con el scroll y enciende cada paso ─────
  gsap.from('#process-track', {
    scaleX: 0,
    ease: 'none',
    scrollTrigger: { trigger: '#process ol', start: 'top 72%', end: 'bottom 70%', scrub: 0.6 },
  });

  gsap.from('#process .dot', {
    scale: 0.3,
    opacity: 0,
    duration: 0.5,
    stagger: 0.18,
    ease: 'back.out(2)',
    scrollTrigger: { trigger: '#process ol', start: 'top 72%' },
  });

  gsap.from('#process .step h3, #process .step p', {
    y: 14,
    opacity: 0,
    duration: 0.45,
    stagger: 0.07,
    scrollTrigger: { trigger: '#process ol', start: 'top 68%' },
  });

  // ── Contact: el teléfono se planta y la curva se dibuja ─────────────
  gsap.fromTo('#contact-script', WIPE_FROM, {
    ...WIPE_TO,
    duration: 1.2,
    ease: 'power2.inOut',
    scrollTrigger: { trigger: '#contact-script', start: 'top 85%' },
  });

  gsap.from('#contact-phone', {
    scale: 0.88,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: { trigger: '#contact-phone', start: 'top 88%' },
  });

  ['#curve-a', '#curve-b'].forEach((sel, i) => {
    const path = document.querySelector(sel);
    if (!path) return;
    dashify(path);
    gsap.to(path, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: { trigger: '#contact', start: 'center bottom', end: 'bottom bottom', scrub: 0.5 },
      delay: i * 0.1,
    });
  });
});
