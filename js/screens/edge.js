// Your Edge — one priming card at a time, shuffled. Built entirely from her
// real proof bank. Tap or swipe to rotate; star the ones that land. No LLM,
// no grading — pure confidence and recall before the call.

import { el, esc } from '../ui.js';
import { navigate } from '../app.js';
import { getKV, setKV } from '../store.js';
import { EDGE_CARDS, EDGE_LABELS } from '../hannah.js';

let order = [];
let pos = 0;

function shuffle(n) {
  const a = [...Array(n).keys()];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function render(root) {
  order = shuffle(EDGE_CARDS.length);
  pos = 0;
  const starred = new Set((await getKV('edgeStarred')) || []);

  const v = el(`<div class="edge-screen screen-enter">
    <div class="edge-top">
      <button class="iconbtn" id="back" title="Back">‹</button>
      <span class="edge-count" id="count"></span>
      <button class="iconbtn" id="shuffle" title="Shuffle">⤮</button>
    </div>
    <div class="edge-stage" id="stage"></div>
    <div class="edge-controls">
      <button class="btn quiet" id="prev">Previous</button>
      <button class="btn" id="next">Next card →</button>
    </div>
    <p class="tiny edge-hint">Tap the card to flip to the next · ${EDGE_CARDS.length} cards from your real work</p>
  </div>`);

  const stage = v.querySelector('#stage');
  const count = v.querySelector('#count');

  const paint = (dir = 1) => {
    const idx = order[pos];
    const card = EDGE_CARDS[idx];
    const isStar = starred.has(idx);
    const node = el(`<div class="edge-card glass edge-${card.type}" data-idx="${idx}">
      <div class="edge-label">${esc(EDGE_LABELS[card.type] || '')}</div>
      <p class="edge-text">${esc(card.text)}</p>
      <button class="edge-star ${isStar ? 'on' : ''}" id="star" title="Star this">${isStar ? '★' : '☆'}</button>
    </div>`);
    node.style.animation = `edgeIn${dir > 0 ? '' : 'Back'} .32s cubic-bezier(.2,.9,.3,1.1)`;
    stage.innerHTML = '';
    stage.appendChild(node);
    count.textContent = `${pos + 1} / ${order.length}`;

    node.onclick = e => { if (e.target.id !== 'star') go(1); };
    node.querySelector('#star').onclick = async (e) => {
      e.stopPropagation();
      if (starred.has(idx)) starred.delete(idx); else starred.add(idx);
      await setKV('edgeStarred', [...starred]);
      paint(0);
    };
  };

  const go = (dir) => {
    pos = (pos + dir + order.length) % order.length;
    paint(dir);
  };

  v.querySelector('#next').onclick = () => go(1);
  v.querySelector('#prev').onclick = () => go(-1);
  v.querySelector('#back').onclick = () => navigate('dashboard');
  v.querySelector('#shuffle').onclick = () => { order = shuffle(EDGE_CARDS.length); pos = 0; paint(1); };

  document.addEventListener('keydown', onKey);
  v._cleanup = () => document.removeEventListener('keydown', onKey);
  function onKey(e) {
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
  }

  paint(1);
  root.innerHTML = '';
  root.appendChild(v);
}

export function cleanup() {
  document.querySelector('.edge-screen')?._cleanup?.();
}
