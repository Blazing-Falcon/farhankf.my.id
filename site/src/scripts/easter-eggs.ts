// Rare, deliberately quiet delights. Everything here is decorative, spawns
// from <template> elements in Layout.astro, and stays out of the way of
// content. See global.css for the .egg-* styles.

function cloneTemplate(id: string): HTMLDivElement | null {
  const tpl = document.getElementById(id);
  if (!(tpl instanceof HTMLTemplateElement)) return null;
  const wrapper = document.createElement('div');
  wrapper.appendChild(tpl.content.cloneNode(true));
  wrapper.setAttribute('aria-hidden', 'true');
  return wrapper;
}

function isTypingContext(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  );
}

// ——— "meow": a cat pops up from the bottom edge to see who said that
let meowBuffer = '';
let meowBusy = false;

function summonMeowCat() {
  const cat = cloneTemplate('egg-tpl-peek');
  if (!cat) return;
  meowBusy = true;
  cat.className = 'egg-meow';
  cat.style.left = `${10 + Math.random() * 70}vw`;
  document.body.appendChild(cat);
  requestAnimationFrame(() => requestAnimationFrame(() => cat.classList.add('egg-meow-up')));
  setTimeout(() => {
    cat.classList.remove('egg-meow-up');
    setTimeout(() => {
      cat.remove();
      meowBusy = false;
    }, 600);
  }, 3500);
}

// ——— Konami code: CAT MODE
const konami = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];
let konamiIndex = 0;
let catModePaws: HTMLElement[] = [];

function showToast(message: string) {
  const toast = document.createElement('div');
  toast.className = 'egg-toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('egg-toast-in')));
  setTimeout(() => {
    toast.classList.remove('egg-toast-in');
    setTimeout(() => toast.remove(), 500);
  }, 2600);
}

function toggleCatMode() {
  const on = document.documentElement.classList.toggle('cat-mode');
  if (on) {
    for (let i = 0; i < 10; i++) {
      const paw = cloneTemplate('egg-tpl-paw');
      if (!paw) break;
      paw.className = 'egg-paw';
      paw.style.left = `${Math.random() * 92}vw`;
      paw.style.top = `${Math.random() * 88}vh`;
      paw.style.transform = `rotate(${Math.round(Math.random() * 90 - 45)}deg)`;
      paw.style.animationDelay = `${i * 0.12}s`;
      document.body.appendChild(paw);
      catModePaws.push(paw);
    }
    showToast('CAT MODE: ON');
  } else {
    catModePaws.forEach((paw) => paw.remove());
    catModePaws = [];
    showToast('CAT MODE: OFF');
  }
}

document.addEventListener('keydown', (event) => {
  if (isTypingContext(event.target)) return;

  // meow buffer
  if (event.key.length === 1) {
    meowBuffer = (meowBuffer + event.key.toLowerCase()).slice(-8);
    if (!meowBusy && meowBuffer.endsWith('meow')) {
      meowBuffer = '';
      summonMeowCat();
    }
  }

  // konami progress (case-insensitive for b/a)
  const expected = konami[konamiIndex];
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (key === expected) {
    konamiIndex += 1;
    if (konamiIndex === konami.length) {
      konamiIndex = 0;
      toggleCatMode();
    }
  } else {
    konamiIndex = key === konami[0] ? 1 : 0;
  }
});

// ——— Rare walk-across: low probability, once per page view.
if (Math.random() < 0.07) {
  setTimeout(() => {
    const cat = cloneTemplate('egg-tpl-walk');
    if (!cat) return;
    cat.className = 'egg-walk';
    cat.addEventListener('animationend', () => cat.remove());
    document.body.appendChild(cat);
  }, 6000);
}
