import './style.css';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { GSDevTools } from 'gsap/GSDevTools';

gsap.registerPlugin(SplitText, GSDevTools);

const canvas = document.getElementById('noise');
const video = document.querySelector('.blendVideo');
const h1 = document.querySelector('h1');

// Zoom final : on plonge dans le 9 de 1945 jusqu'à ce que son rouge couvre l'écran
const ZOOM = 4;

function init() {
  const split = new SplitText(h1, {
    type: 'words,chars',
    wordsClass: 'words',
    charsClass: 'chars',
  });
  const nine = split.chars.find((c) => c.textContent === '9');

  // Point visé, mesuré avant toute transformation : sur le fût gauche de la
  // panse du 9 (un point plein, pas le contre-poinçon), en écart au centre
  // du h1. Le h1 étant centré dans l'écran et son origine de transformation
  // en son centre, un point à (dx, dy) se retrouve en (x + s·dx, y + s·dy).
  const hb = h1.getBoundingClientRect();
  const nb = nine.getBoundingClientRect();
  const dx = nb.left + nb.width * 0.16 - (hb.left + hb.width / 2);
  const dy = nb.top + nb.height * 0.3 - (hb.top + hb.height / 2);

  gsap.set('.effect', { autoAlpha: 1 }); // retire le flash sans style

  const tl = gsap
    .timeline({ paused: true })
    .fromTo(canvas, { opacity: 0.15 }, { opacity: 0.05, duration: 3, ease: 'none' })
    .fromTo(split.words[0], { x: '300%' }, { x: '0%', duration: 2, ease: 'power1' }, 0)
    .fromTo(split.words[1], { x: '-300%' }, { x: '0%', duration: 2, ease: 'power1' }, '<+=0.5')
    // Un seul zoom, du titre minuscule jusqu'au cœur du 9 : le titre grossit
    // en glissant pour que le 9 finisse au centre, son rouge couvrant l'écran.
    // Il démarre dès que les deux mots se sont rejoints.
    .fromTo(
      h1,
      { scale: 0.03, x: 0, y: 0 },
      { scale: ZOOM, x: -ZOOM * dx, y: -ZOOM * dy, duration: 8, ease: 'power4.inOut' },
      '>',
    )
    .to(video, { scale: 1, duration: 8 }, '<')
    // Tout à la fin, le fond vire au rouge pour effacer les derniers résidus
    .to('.dark', { backgroundColor: 'red', duration: 0.4, ease: 'power1.in' }, '>-=0.4');

  GSDevTools.create({ animation: tl });

  // Lance la vidéo et l'animation ensemble ; un clic rejoue le tout.
  function play() {
    video.currentTime = 0;
    video.play().catch(() => {}); // lecture auto refusée : l'animation joue quand même
    tl.restart();
  }

  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) play();
  else video.addEventListener('canplay', play, { once: true });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.gs-dev-tools')) return; // clic dans la barre GSDevTools
    play();
  });
}

// Les mesures dépendent de la police : on attend qu'elle soit chargée
document.fonts.ready.then(init);

/* Grain */
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function noise(ctx) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const idata = ctx.createImageData(w, h);
  const buffer32 = new Uint32Array(idata.data.buffer);
  const len = buffer32.length;
  let i = 0;

  for (; i < len; ) buffer32[i++] = ((255 * Math.random()) | 0) << 24;

  ctx.putImageData(idata, 0, 0);
}

let toggle = true;

// une image sur deux : 30 FPS au lieu de 60
(function loop() {
  toggle = !toggle;
  if (toggle) {
    requestAnimationFrame(loop);
    return;
  }
  noise(ctx);
  requestAnimationFrame(loop);
})();
