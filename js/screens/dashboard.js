// Home — Hannah's war room. A readiness strip across the four Google
// attributes, then the four-card deck: Practice, Full Mock, Your Edge,
// Game Plan. Recent sessions below once she's started.

import { el, esc, fmtDate, score1, sparkline } from '../ui.js';
import { getSessions } from '../store.js';
import { CATEGORIES } from '../prompts.js';
import { PROFILE, ATTRIBUTES } from '../hannah.js';
import { navigate } from '../app.js';

const CARDS = [
  { id: 'practice', go: () => navigate('session', {}), icon: '🎤', title: 'Practice', sub: 'One question, real feedback. Your everyday rep.' },
  { id: 'mock', go: () => navigate('mock'), icon: '🎯', title: 'Full mock', sub: 'Six questions back-to-back, one readiness report.' },
  { id: 'edge', go: () => navigate('edge'), icon: '⚡️', title: 'Your edge', sub: 'Flip through your proof. Prime before the call.' },
  { id: 'gameplan', go: () => navigate('gameplan'), icon: '📋', title: 'Game plan', sub: 'North star, stories, the 7-day plan.' },
];

export async function render(root) {
  const sessions = await getSessions();

  // Readiness across the four attributes.
  const byAttr = {};
  for (const key of Object.keys(ATTRIBUTES)) {
    const of = sessions.filter(s => (s.attribute || mapCat(s.category)) === key);
    byAttr[key] = of.length ? of.reduce((a, s) => a + s.score, 0) / of.length : null;
  }
  const scored = sessions.filter(s => typeof s.score === 'number');
  const readiness = scored.length ? scored.reduce((a, s) => a + s.score, 0) / scored.length : null;
  const trend = sessions.slice(0, 12).map(s => s.score).reverse();

  const v = el(`<div class="stack screen-enter">
    <div class="home-hero">
      <div>
        <h1>${sessions.length ? 'Welcome back, Hannah' : 'Let’s get you ready, Hannah'}</h1>
        <p class="muted" style="margin-top:4px">${esc(PROFILE.role)} · ${esc(PROFILE.level)}</p>
      </div>
      ${readiness != null ? `<div class="home-readiness">
        <div class="label">Readiness</div>
        <span class="hero-num">${score1(readiness)}</span><span class="hero-denom"> /10</span>
        ${trend.length > 1 ? sparkline(trend) : ''}
      </div>` : ''}
    </div>

    ${scored.length ? `<div class="attr-strip">
      ${Object.entries(ATTRIBUTES).map(([k, a]) => {
        const val = byAttr[k];
        return `<div class="attr-cell" title="${esc(a.test)}">
          <div class="attr-name">${esc(a.name)}</div>
          <div class="attr-val">${val == null ? '—' : score1(val)}</div>
          <div class="bar"><i class="${val != null && val < 6 ? 'weak' : ''}" style="width:${val == null ? 0 : val * 10}%"></i></div>
        </div>`;
      }).join('')}
    </div>` : ''}

    <div class="glass home-warmup tappable" id="warmup-banner">
      <div class="home-warmup-icon">🔥</div>
      <div class="home-warmup-text">
        <b>Interview soon?</b>
        <span>Take a 10-minute warm-up — two questions to get your voice going.</span>
      </div>
      <span class="home-warmup-arrow">→</span>
    </div>

    <div class="grid2 home-deck">
      ${CARDS.map(c => `<div class="glass card home-card tappable" data-go="${c.id}">
        <div class="home-card-icon">${c.icon}</div>
        <div>
          <h2>${esc(c.title)}</h2>
          <p class="muted" style="font-size:13.5px;margin-top:3px">${esc(c.sub)}</p>
        </div>
      </div>`).join('')}
    </div>

    ${sessions.length ? `<div class="glass" style="overflow:hidden">
      <div class="sessionrow-head">Recent answers</div>
      ${sessions.slice(0, 6).map(s => `
        <div class="sessionrow" data-id="${s.id}">
          <div class="q">
            <div class="cat">${esc(ATTRIBUTES[s.attribute]?.name || CATEGORIES[s.category] || s.category)}${s.mockId ? ' · mock' : ''}</div>
            <div class="text">${esc(s.question)}</div>
          </div>
          <span class="scorechip ${s.score < 6 ? 'low' : ''}">${score1(s.score)}</span>
          <span class="when">${fmtDate(s.ts)}</span>
        </div>`).join('')}
    </div>` : ''}
  </div>`);

  v.querySelector('#warmup-banner').onclick = () => navigate('warmup');
  v.querySelectorAll('.home-card').forEach(c => {
    c.onclick = () => CARDS.find(x => x.id === c.dataset.go).go();
  });
  v.querySelectorAll('.sessionrow').forEach(r => {
    if (r.dataset.id) r.onclick = () => navigate('report', { id: r.dataset.id });
  });

  root.innerHTML = '';
  root.appendChild(v);
}

// Older sessions stored a category but no attribute — map it for readiness.
function mapCat(cat) {
  return { behavioral: 'cognitive', hypothetical: 'role', googleyness: 'googleyness', role: 'role' }[cat] || 'role';
}
