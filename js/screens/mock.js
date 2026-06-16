// Full Mock — ~6 questions back-to-back across all four attributes, no feedback
// between answers (like the real thing), then one combined readiness report.
// Each answer is also saved as a normal session so it shows in history.

import { el, esc, toast, fmtClock, countFillers, hashQuestion, showError } from '../ui.js';
import { saveSession, saveAudio, getSettings } from '../store.js';
import { chatJSON } from '../llm.js';
import { gradePrompts, CATEGORIES } from '../prompts.js';
import { Recorder } from '../speech.js';
import { navigate } from '../app.js';
import { mockSlate, ATTRIBUTES, PROFILE } from '../hannah.js';

let rec = null;
let clears = [];
const every = (fn, ms) => { const id = setInterval(fn, ms); clears.push(() => clearInterval(id)); };

export function cleanup() {
  rec?.dispose(); rec = null;
  clears.forEach(fn => fn()); clears = [];
}

const ctx = { level: PROFILE.level, profile: { level: PROFILE.level, title: PROFILE.role }, roleFamily: '', materialsText: '' };

export async function render(root) {
  const slate = mockSlate();
  const mockId = crypto.randomUUID();
  const results = [];
  intro(root, slate, () => runQuestion(root, slate, 0, results, mockId));
}

function stage(root, inner, cls = '') {
  root.innerHTML = `<div class="glass session-stage screen-enter ${cls}" style="max-width:760px;margin:0 auto">${inner}</div>`;
  return root.firstElementChild;
}

function intro(root, slate, start) {
  const v = stage(root, `
    <h1>Full mock interview</h1>
    <p class="muted" style="max-width:440px;margin-top:10px">${slate.length} questions across all four areas Google assesses. No feedback until the end — just like the real thing. Answer out loud, keep each to about two minutes.</p>
    <div class="mock-pills">${slate.map((s, i) => `<span class="mock-pill">${i + 1}. ${esc(ATTRIBUTES[s.attribute]?.name || s.category)}</span>`).join('')}</div>
    <div class="row" style="margin-top:24px">
      <button class="btn quiet" id="cancel">Back</button>
      <button class="btn" id="begin">Begin mock</button>
    </div>
  `);
  v.querySelector('#cancel').onclick = () => navigate('dashboard');
  v.querySelector('#begin').onclick = start;
}

async function runQuestion(root, slate, i, results, mockId) {
  const item = slate[i];
  const v = stage(root, `
    <div class="mock-progress">Question ${i + 1} of ${slate.length} · ${esc(ATTRIBUTES[item.attribute]?.name || '')}</div>
    <div class="session-q" style="margin-top:14px">${esc(item.q)}</div>
    <canvas id="wave" width="840" height="112" style="margin-top:24px"></canvas>
    <div class="bigtimer" id="timer">0:00</div>
    <button class="stopbtn" id="stop" aria-label="Stop and continue"></button>
    <div class="live-text" id="live"></div>
    <button class="linkish" id="typed" style="margin-top:8px">Type instead</button>
  `);

  rec = new Recorder();
  let micErr = null;
  const micReady = await rec.prepare().then(() => true).catch(e => { micErr = e; return false; });
  if (!micReady) {
    rec?.dispose(); rec = null;
    showError(micErr || { kind: 'mic-other' }, [
      { id: 'type', label: 'Type my answer instead', fn: () => typed(root, slate, i, results, mockId, item) },
    ]);
    return;
  }

  const levels = [];
  let lastPush = 0;
  const canvas = v.querySelector('#wave');
  const cx = canvas.getContext('2d');
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#0a84ff';
  rec.onText = (final, interim) => { v.querySelector('#live').textContent = '…' + (final + ' ' + interim).slice(-150); };
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
      levels.forEach((l, k) => {
        const h = Math.max(4, l * canvas.height * 0.92);
        const x = canvas.width - (levels.length - k) * (bw + gap);
        cx.beginPath(); cx.roundRect(x, mid - h / 2, bw, h, 3); cx.fill();
      });
    },
  });

  const started = Date.now();
  const timer = v.querySelector('#timer');
  every(() => {
    const sec = Math.floor((Date.now() - started) / 1000);
    timer.textContent = fmtClock(sec);
    timer.classList.toggle('over', sec > 150);
  }, 500);

  v.querySelector('#typed').onclick = () => {
    clears.forEach(fn => fn()); clears = [];
    rec?.dispose(); rec = null;
    typed(root, slate, i, results, mockId, item);
  };

  v.querySelector('#stop').onclick = async () => {
    clears.forEach(fn => fn()); clears = [];
    const r = rec; rec = null;
    const { blob, transcript, durationSec } = await r.stop();
    if (durationSec < 8 || !transcript) {
      toast('Too short to grade — type your answer instead.', 'err');
      return typed(root, slate, i, results, mockId, item, { blob, durationSec });
    }
    advance(root, slate, i, results, mockId, item, { blob, transcript, durationSec });
  };
}

function typed(root, slate, i, results, mockId, item, prior = {}) {
  const v = stage(root, `
    <div class="mock-progress">Question ${i + 1} of ${slate.length}</div>
    <div class="session-q" style="margin-top:14px">${esc(item.q)}</div>
    <textarea id="ans" rows="8" style="max-width:620px;margin-top:18px;text-align:left" placeholder="Type your answer as you'd say it…"></textarea>
    <div class="row" style="margin-top:14px">
      <button class="btn" id="next">${i + 1 === slate.length ? 'Finish & see report' : 'Next question →'}</button>
    </div>
  `);
  v.querySelector('#next').onclick = () => {
    const transcript = v.querySelector('#ans').value.trim();
    if (transcript.split(/\s+/).length < 20) { toast('Give it a real attempt.', 'err'); return; }
    const words = transcript.split(/\s+/).length;
    advance(root, slate, i, results, mockId, item, { blob: prior.blob || null, transcript, durationSec: prior.durationSec || Math.round((words / 150) * 60) });
  };
}

async function advance(root, slate, i, results, mockId, item, ans) {
  const last = i + 1 === slate.length;
  stage(root, `<div class="spin"></div><p class="muted" style="margin-top:16px">${last ? 'Scoring your mock…' : 'Logged. Loading the next question…'}</p>`);

  const words = ans.transcript.split(/\s+/).length;
  const wpm = Math.round(words / (ans.durationSec / 60)) || 0;
  const fillers = countFillers(ans.transcript);

  try {
    const { system, user } = gradePrompts({ ...ctx, question: item.q, category: item.category, transcript: ans.transcript, durationSec: ans.durationSec, wpm, fillers });
    const g = await chatJSON(system, user, { maxTokens: 6000 });
    const session = {
      id: crypto.randomUUID(), ts: Date.now(), mockId,
      category: item.category, attribute: item.attribute, question: item.q,
      questionId: hashQuestion(item.q), level: ctx.level,
      transcript: ans.transcript, durationSec: ans.durationSec, wpm, fillers,
      score: clamp10(g.score), verdict: g.verdict || '',
      subscores: { structure: clamp10(g.subscores?.structure), specificity: clamp10(g.subscores?.specificity), relevance: clamp10(g.subscores?.relevance), delivery: clamp10(g.subscores?.delivery) },
      great: (g.great || []).slice(0, 3), errors: (g.errors || []).slice(0, 3),
      strengthTags: (g.strengthTags || []).slice(0, 3), rewrite: g.rewrite || '',
      annotations: (g.annotations || []).slice(0, 4),
    };
    await saveSession(session);
    if (ans.blob && ans.blob.size) await saveAudio(session.id, ans.blob);
    results.push(session);
  } catch (e) {
    showError(e);
    results.push({ question: item.q, attribute: item.attribute, score: null });
  }

  if (last) report(root, results);
  else runQuestion(root, slate, i + 1, results, mockId);
}

function report(root, results) {
  const graded = results.filter(r => r.score != null);
  const overall = graded.length ? graded.reduce((a, r) => a + r.score, 0) / graded.length : 0;

  const byAttr = {};
  for (const key of Object.keys(ATTRIBUTES)) {
    const of = graded.filter(r => r.attribute === key);
    byAttr[key] = of.length ? of.reduce((a, r) => a + r.score, 0) / of.length : null;
  }

  const v = el(`<div class="stack screen-enter" style="max-width:760px;margin:0 auto">
    <div class="center" style="padding:6px 0">
      <span class="tiny" style="text-transform:uppercase;letter-spacing:.05em;font-weight:650">Mock complete</span>
      <h1 style="margin-top:6px">Mock readiness: ${overall.toFixed(1)}<span class="hero-denom"> /10</span></h1>
    </div>

    <div class="glass card">
      <h3>By area</h3>
      <div class="subscores" style="margin-top:12px">
        ${Object.entries(ATTRIBUTES).map(([k, a]) => {
          const val = byAttr[k];
          return `<div class="subrow">
            <span class="nm">${esc(a.name)}</span>
            <div class="bar"><i class="${val != null && val < 6 ? 'weak' : ''}" style="width:${val == null ? 0 : val * 10}%"></i></div>
            <span class="n">${val == null ? '—' : val.toFixed(1)}</span>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="glass" style="overflow:hidden">
      ${results.map((r, i) => `
        <div class="sessionrow" ${r.id ? `data-id="${r.id}"` : ''}>
          <div class="q">
            <div class="cat">Q${i + 1} · ${esc(ATTRIBUTES[r.attribute]?.name || '')}</div>
            <div class="text">${esc(r.question)}</div>
          </div>
          ${r.score == null ? '<span class="tiny">not scored</span>' : `<span class="scorechip ${r.score < 6 ? 'low' : ''}">${r.score.toFixed(1)}</span>`}
        </div>`).join('')}
    </div>

    <div class="row" style="justify-content:center;padding:6px 0 10px">
      <button class="btn quiet" id="home">Back to home</button>
      <button class="btn" id="again">Run another mock</button>
    </div>
  </div>`);

  v.querySelectorAll('.sessionrow[data-id]').forEach(rrow => {
    rrow.onclick = () => navigate('report', { id: rrow.dataset.id });
  });
  v.querySelector('#home').onclick = () => navigate('dashboard');
  v.querySelector('#again').onclick = () => navigate('mock');

  root.innerHTML = '';
  root.appendChild(v);
  window.scrollTo({ top: 0 });
}

const clamp10 = n => Math.max(0, Math.min(10, Number(n) || 0));
