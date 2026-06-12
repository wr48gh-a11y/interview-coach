// Home: readiness hero, suggested next question, aggregated top-3 strengths
// and recurring errors, category tiles, recent sessions. Empty state on first
// launch. Everything computed client-side from stored sessions.

import { el, esc, fmtDate, score1, sparkline } from '../ui.js';
import { getSessions } from '../store.js';
import { CATEGORIES, ERROR_TAGS, STRENGTH_TAGS } from '../prompts.js';
import { navigate } from '../app.js';

const AGG_WINDOW = 10;

export async function render(root) {
  const sessions = await getSessions();
  root.innerHTML = '';
  const view = sessions.length ? full(sessions) : empty();
  view.classList.add('screen-enter');
  root.appendChild(view);
}

/* ---------- empty state ---------- */

function empty() {
  const v = el(`<div>
    <div class="glass empty-hero">
      <h1>Your dashboard builds itself as you practice</h1>
      <p class="muted" style="margin:10px auto 22px;max-width:380px">Answer one question to unlock your readiness score, strengths, and coaching trends.</p>
      <button class="btn" id="start">Start your first session</button>
      <div class="ghost-row" aria-hidden="true"><div></div><div></div><div></div></div>
    </div>
  </div>`);
  v.querySelector('#start').onclick = () => navigate('session', {});
  return v;
}

/* ---------- aggregation ---------- */

function aggregate(sessions) {
  const recent = sessions.slice(0, AGG_WINDOW);
  const readiness = recent.reduce((a, s) => a + s.score, 0) / recent.length;
  const trend = sessions.slice(0, 12).map(s => s.score).reverse();

  const catAvg = {};
  const catCount = {};
  for (const c of Object.keys(CATEGORIES)) {
    const of = sessions.filter(s => s.category === c);
    catCount[c] = of.length;
    catAvg[c] = of.length ? of.reduce((a, s) => a + s.score, 0) / of.length : null;
  }

  const unpracticed = Object.keys(CATEGORIES).filter(c => catAvg[c] === null);
  const practiced = Object.keys(CATEGORIES).filter(c => catAvg[c] !== null);
  const weakest = practiced.sort((a, b) => catAvg[a] - catAvg[b])[0];
  const suggested = unpracticed[0] || weakest;
  const suggestedWhy = unpracticed[0]
    ? `You haven't tried ${CATEGORIES[unpracticed[0]].toLowerCase()} questions yet`
    : `${CATEGORIES[weakest]} is your weakest area (${score1(catAvg[weakest])} average)`;

  const count = (key) => {
    const tally = {};
    for (const s of recent) {
      const tags = key === 'err'
        ? (s.errors || []).map(e => e.tag)
        : (s.strengthTags || []);
      for (const t of new Set(tags.filter(Boolean))) tally[t] = (tally[t] || 0) + 1;
    }
    return Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 3);
  };

  return {
    readiness, trend, catAvg, catCount, suggested, suggestedWhy,
    topErrors: count('err'), topStrengths: count('str'), window: recent.length,
  };
}

/* ---------- full dashboard ---------- */

function full(sessions) {
  const a = aggregate(sessions);
  const latest = sessions[0];

  const t3 = (rows, labels, good, windowN) => rows.length >= 1 && windowN >= 2
    ? rows.map(([tag, n]) => `<div class="item">
        <span class="ic ${good ? 'good' : 'bad'}">${good ? '✓' : '✕'}</span>
        <span><b>${esc(labels[tag] || tag)}</b> — in ${n} of your last ${windowN} answers</span>
      </div>`).join('')
    : `<div class="item"><span class="muted tiny">Patterns appear after a couple of sessions.</span></div>`;

  const v = el(`<div class="stack">
    <div class="grid2">
      <div class="glass card">
        <div class="label">Readiness</div>
        <span class="hero-num">${score1(a.readiness)}</span><span class="hero-denom"> /10</span>
        ${sparkline(a.trend)}
        <p class="tiny" style="margin-top:8px">${a.trend.length > 1 ? `Across your last ${a.window} session${a.window > 1 ? 's' : ''}` : 'First session logged — the trend starts here'}</p>
      </div>
      <div class="glass card" style="display:flex;flex-direction:column">
        <div class="label">💡 Suggested next</div>
        <h2 style="margin:2px 0 6px">${esc(a.suggestedWhy)}</h2>
        <p class="muted" style="font-size:13.5px">Your coach will write a fresh ${esc(CATEGORIES[a.suggested].toLowerCase())} question calibrated to your target role.</p>
        <div style="margin-top:auto;padding-top:14px">
          <button class="btn" id="suggested">Start session</button>
        </div>
      </div>
    </div>

    <div class="grid2">
      <div class="glass card">
        <h3>Top 3 things going well</h3>
        <div class="t3">${t3(a.topStrengths, STRENGTH_TAGS, true, a.window)}</div>
      </div>
      <div class="glass card">
        <h3>Top 3 recurring errors</h3>
        <div class="t3">${t3(a.topErrors, ERROR_TAGS, false, a.window)}</div>
      </div>
    </div>

    <div class="grid4">
      ${Object.entries(CATEGORIES).map(([key, name]) => {
        const avg = a.catAvg[key];
        const weak = key === a.suggested && avg !== null;
        const n = a.catCount[key];
        return `<div class="glass tile tappable card-tile" data-cat="${key}" title="Practice ${esc(name.toLowerCase())}">
          <div class="cat">${esc(name)}</div>
          <div class="val">${avg === null ? '—' : score1(avg)}</div>
          <div class="bar"><i class="${weak ? 'weak' : ''}" style="width:${avg === null ? 0 : avg * 10}%"></i></div>
          <div class="tile-count">${n ? `${n} session${n > 1 ? 's' : ''}` : 'Not tried yet'}</div>
        </div>`;
      }).join('')}
    </div>

    <div class="glass" style="overflow:hidden">
      ${sessions.slice(0, 8).map(s => `
        <div class="sessionrow" data-id="${s.id}">
          <div class="q">
            <div class="cat">${esc(CATEGORIES[s.category] || s.category)}${s.retryOf ? ' · retry' : ''}</div>
            <div class="text">${esc(s.question)}</div>
          </div>
          <span class="scorechip ${s.score < 6 ? 'low' : ''}">${score1(s.score)}</span>
          <span class="when">${fmtDate(s.ts)}</span>
        </div>`).join('')}
    </div>
  </div>`);

  v.querySelector('#suggested').onclick = () => navigate('session', { category: a.suggested });
  v.querySelectorAll('.card-tile').forEach(t => {
    t.onclick = () => navigate('session', { category: t.dataset.cat });
    t.classList.add('tappable');
  });
  v.querySelectorAll('.sessionrow').forEach(r => {
    r.onclick = () => navigate('report', { id: r.dataset.id });
  });
  void latest;
  return v;
}
