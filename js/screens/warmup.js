// Day-of warm-up — the morning of the interview. Two questions, a short think,
// a quick calming read (no deep grade, no rewrite), then "you're warm, go."
// Deliberately the opposite of Practice: light, fast, reassuring. Nothing here
// is saved — it's a ritual to get her voice going, not a scored rep.

import { el, esc, toast, fmtClock } from '../ui.js';
import { getSettings } from '../store.js';
import { chatJSON } from '../llm.js';
import { warmupPrompts, CATEGORIES } from '../prompts.js';
import { Recorder } from '../speech.js';
import { navigate } from '../app.js';
import { QUESTION_BANK, PROFILE } from '../hannah.js';

const THINK_SECONDS = 12;

let rec = null;
let clears = [];
const every = (fn, ms) => { const id = setInterval(fn, ms); clears.push(() => clearInterval(id)); };

export function cleanup() {
  rec?.dispose();
  rec = null;
  clears.forEach(fn => fn());
  clears = [];
}

// Q1 is the literal first thing she'll be asked; Q2 a behavioural curveball.
function slate() {
  const behav = [];
  for (const [attr, qs] of Object.entries(QUESTION_BANK.behavioral))
    qs.forEach(q => behav.push({ q, category: 'behavioral', attribute: attr }));
  return [
    { q: QUESTION_BANK.opener[0], category: 'opener', attribute: 'role' },
    behav[Math.floor(Math.random() * behav.length)],
  ];
}

function vibe(score) {
  if (score >= 8) return 'Sharp';
  if (score >= 6.5) return 'Warm';
  if (score >= 5) return 'Loosening up';
  return 'Shake it out';
}

export async function render(root) {
  introStage(root, slate(), []);
}

function stage(root, inner) {
  root.innerHTML = `<div class="glass session-stage screen-enter" style="max-width:760px;margin:0 auto">${inner}</div>`;
  return root.firstElementChild;
}

/* ---------- intro ---------- */

function introStage(root, qs, reads) {
  const v = stage(root, `
    <div class="warmup-badge">🔥 Warm-up</div>
    <div class="session-q" style="max-width:520px">Two questions to get your voice going.</div>
    <p class="muted" style="max-width:440px;margin-top:8px">A quick read after each — no deep notes today. Then you’re ready to walk in.</p>
    <div class="row" style="margin-top:26px">
      <button class="btn" id="go">Let’s go</button>
    </div>
    <button class="linkish" id="home" style="margin-top:12px">Back to home</button>
  `);
  v.querySelector('#go').onclick = () => thinkStage(root, qs, 0, reads);
  v.querySelector('#home').onclick = () => navigate('dashboard');
}

/* ---------- think ---------- */

function thinkStage(root, qs, i, reads) {
  const q = qs[i];
  const C = 2 * Math.PI * 44;
  const v = stage(root, `
    <div class="warmup-step">Question ${i + 1} of ${qs.length}</div>
    <div class="session-q" style="margin-top:8px">${esc(q.q)}</div>
    <div class="ring-wrap">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle class="ring-track" cx="48" cy="48" r="44" fill="none" stroke-width="5"/>
        <circle class="ring-fill" id="ring" cx="48" cy="48" r="44" fill="none" stroke-width="5"
          stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0"/>
      </svg>
      <div class="ring-num" id="num">${THINK_SECONDS}</div>
    </div>
    <p class="tiny">Take a breath — then just talk</p>
    <div class="row" style="margin-top:22px">
      <button class="btn" id="now">Start answering</button>
    </div>
    <button class="linkish" id="typed" style="margin-top:10px">Type it instead</button>
  `);

  rec = new Recorder();
  const micReady = rec.prepare().then(() => true).catch(() => false);

  let t = THINK_SECONDS;
  const ring = v.querySelector('#ring');
  const num = v.querySelector('#num');
  const go = async () => {
    clears.forEach(fn => fn()); clears = [];
    if (await micReady) recordStage(root, qs, i, reads);
    else { toast('Microphone unavailable — type your answer instead.', 'err'); typedStage(root, qs, i, reads); }
  };

  every(() => {
    t -= 1;
    num.textContent = t;
    ring.style.strokeDashoffset = String(C * (1 - t / THINK_SECONDS));
    if (t <= 0) go();
  }, 1000);

  v.querySelector('#now').onclick = go;
  v.querySelector('#typed').onclick = () => {
    clears.forEach(fn => fn()); clears = [];
    rec?.dispose(); rec = null;
    typedStage(root, qs, i, reads);
  };
}

/* ---------- record ---------- */

function recordStage(root, qs, i, reads) {
  const q = qs[i];
  const v = stage(root, `
    <p class="session-intent" style="max-width:560px">${esc(q.q)}</p>
    <canvas id="wave" width="840" height="112"></canvas>
    <div class="bigtimer" id="timer">0:00</div>
    <p class="target-hint">Just get warm — a minute or two is plenty</p>
    <button class="stopbtn" id="stop" aria-label="Stop recording"></button>
    <div class="live-text" id="live"></div>
  `);

  const levels = [];
  let lastPush = 0;
  const canvas = v.querySelector('#wave');
  const cx = canvas.getContext('2d');
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#0a84ff';

  rec.onText = (final, interim) => {
    v.querySelector('#live').textContent = '…' + (final + ' ' + interim).slice(-150);
  };

  rec.start({
    onLevel: lvl => {
      const now = performance.now();
      if (now - lastPush < 45) return;
      lastPush = now;
      levels.push(Math.min(1, lvl * 3.2));
      if (levels.length > 88) levels.shift();
      cx.clearRect(0, 0, canvas.width, canvas.height);
      cx.fillStyle = accent;
      const bw = 6, gap = 3.5, mid = canvas.height / 2;
      levels.forEach((l, idx) => {
        const h = Math.max(4, l * canvas.height * 0.92);
        const x = canvas.width - (levels.length - idx) * (bw + gap);
        cx.beginPath();
        cx.roundRect(x, mid - h / 2, bw, h, 3);
        cx.fill();
      });
    },
  });

  const started = Date.now();
  const timer = v.querySelector('#timer');
  every(() => { timer.textContent = fmtClock(Math.floor((Date.now() - started) / 1000)); }, 500);

  v.querySelector('#stop').onclick = async () => {
    clears.forEach(fn => fn()); clears = [];
    const r = rec; rec = null;
    const { transcript, durationSec } = await r.stop();
    if (durationSec < 6) { toast('A few sentences is enough — give it a go.', 'err'); thinkStage(root, qs, i, reads); return; }
    if (!transcript) { toast("Couldn't hear that — type what you said.", 'err'); typedStage(root, qs, i, reads); return; }
    readStage(root, qs, i, reads, transcript);
  };
}

/* ---------- typed fallback ---------- */

function typedStage(root, qs, i, reads) {
  const q = qs[i];
  const v = stage(root, `
    <p class="session-intent" style="max-width:560px">${esc(q.q)}</p>
    <textarea id="ans" rows="8" style="max-width:620px;margin-top:18px;text-align:left"
      placeholder="Type your answer as you’d say it out loud…"></textarea>
    <div class="row" style="margin-top:16px">
      <button class="btn quiet" id="skip">Skip</button>
      <button class="btn" id="read">Quick read</button>
    </div>
  `);
  v.querySelector('#skip').onclick = () => next(root, qs, i, reads);
  v.querySelector('#read').onclick = () => {
    const transcript = v.querySelector('#ans').value.trim();
    if (transcript.split(/\s+/).length < 20) { toast('Give it a real attempt — a few sentences.', 'err'); return; }
    readStage(root, qs, i, reads, transcript);
  };
}

/* ---------- quick read ---------- */

async function readStage(root, qs, i, reads, transcript) {
  const q = qs[i];
  const provider = getSettings().provider === 'openai' ? 'ChatGPT' : 'Claude';
  stage(root, `<div class="spin"></div>
    <p class="muted" style="margin-top:16px">${esc(provider)} is taking a quick listen…</p>`);

  let read;
  try {
    const { system, user } = warmupPrompts({ level: PROFILE.level, question: q.q, category: q.category });
    const g = await chatJSON(system, user, { maxTokens: 700 });
    read = { score: clamp10(g.score), verdict: g.verdict || '', tip: g.tip || '' };
  } catch {
    read = { score: null, verdict: 'Good — you got the words out. That’s the point today.', tip: '' };
  }

  const word = read.score == null ? 'Warm' : vibe(read.score);
  const v = stage(root, `
    <div class="warmup-step">Question ${i + 1} of ${qs.length}</div>
    <div class="warmup-vibe">${esc(word)}</div>
    <p class="warmup-verdict">${esc(read.verdict)}</p>
    ${read.tip ? `<p class="warmup-tip">For the real thing: ${esc(read.tip)}</p>` : ''}
    ${read.score != null ? `<p class="tiny" style="margin-top:10px">${read.score}/10 · warm-up read</p>` : ''}
    <div class="row" style="margin-top:24px">
      <button class="btn" id="next">${i + 1 < qs.length ? 'Next question' : 'Finish warm-up'}</button>
    </div>
  `);
  v.querySelector('#next').onclick = () => next(root, qs, i, [...reads, { word, ...read }]);
}

function next(root, qs, i, reads) {
  if (i + 1 < qs.length) thinkStage(root, qs, i + 1, reads);
  else closeStage(root, reads);
}

/* ---------- close ---------- */

function closeStage(root, reads) {
  const v = stage(root, `
    <div class="warmup-badge">✓ Warm</div>
    <div class="session-q" style="max-width:520px">You’re warm, ${esc(PROFILE.name.split(' ')[0])}.</div>
    <p class="muted" style="max-width:440px;margin-top:8px">Trust your prep. Walk in and tell your stories — clear opener, one metric, what changed.</p>
    ${reads.length ? `<div class="warmup-recap">
      ${reads.map((r, n) => `<div class="warmup-recap-row">
        <span class="warmup-recap-q">Q${n + 1}</span>
        <span class="warmup-recap-word">${esc(r.word)}</span>
      </div>`).join('')}
    </div>` : ''}
    <div class="row" style="margin-top:24px">
      <button class="btn" id="home">Back to home</button>
    </div>
  `);
  v.querySelector('#home').onclick = () => navigate('dashboard');
  void CATEGORIES;
}

const clamp10 = n => Math.max(0, Math.min(10, Number(n) || 0));
