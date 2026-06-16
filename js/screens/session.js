// One practice session: generate question → 30s think → record (live
// transcript + waveform) → LLM grading → report. Typed-answer fallback for
// browsers without speech recognition or denied mic permission.

import { el, esc, toast, fmtClock, countFillers, hashQuestion, showError } from '../ui.js';
import { getKV, getSessions, getSession, saveSession, saveAudio, getSettings } from '../store.js';
import { chatJSON } from '../llm.js';
import { questionPrompts, gradePrompts, CATEGORIES } from '../prompts.js';
import { materialsToText } from '../files.js';
import { Recorder } from '../speech.js';
import { navigate } from '../app.js';
import { allQuestions, questionForStory, storyById, PROFILE } from '../hannah.js';

const THINK_SECONDS = 30;

let rec = null;
let clears = [];
const later = (fn, ms) => { const id = setTimeout(fn, ms); clears.push(() => clearTimeout(id)); };
const every = (fn, ms) => { const id = setInterval(fn, ms); clears.push(() => clearInterval(id)); };

export function cleanup() {
  rec?.dispose();
  rec = null;
  clears.forEach(fn => fn());
  clears = [];
}

export async function render(root, params = {}) {
  // Practice opens on a chooser: which kind of question to drill today.
  if (params.pick) { pickerStage(root); return; }

  const ctx = await loadContext();
  const category = params.category || 'behavioral';

  if (params.question) {
    thinkStage(root, ctx, { ...params, category });
    return;
  }

  // Story Drill: pick a real question this story answers, and carry the story
  // through so grading judges whether she actually deployed it.
  if (params.targetStoryId) {
    const past = (await getSessions()).map(s => s.question);
    const m = questionForStory(params.targetStoryId, past);
    if (m) {
      thinkStage(root, ctx, { category: m.category, attribute: m.attribute, question: m.q, intent: '', targetStoryId: params.targetStoryId });
      return;
    }
  }

  // Pull from Hannah's real question bank first, avoiding ones she's already
  // practiced. These are the proven questions from her workbook.
  const past = (await getSessions()).map(s => s.question);
  let pool = allQuestions();
  if (params.attribute) pool = pool.filter(x => x.attribute === params.attribute);
  if (params.category) pool = pool.filter(x => x.category === params.category);
  const fresh = pool.filter(x => !past.includes(x.q));
  const choice = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length ? fresh.length : pool.length))];

  if (choice) {
    thinkStage(root, ctx, { category: choice.category, attribute: choice.attribute, question: choice.q, intent: '', lock: !!params.lock });
    return;
  }

  // Fallback: generate one if the bank is somehow empty.
  stage(root, `<div class="spin"></div>
    <p class="muted" style="margin-top:16px">Writing your question…</p>
    <p class="tiny">${esc(CATEGORIES[category])} · calibrated to ${esc(ctx.level)}</p>`);
  try {
    const { system, user } = questionPrompts({ ...ctx, category, pastQuestions: past });
    const q = await chatJSON(system, user, { maxTokens: 1500 });
    thinkStage(root, ctx, { category, question: q.question, intent: q.intent });
  } catch (e) {
    failStage(root, `Couldn't write a question: ${e.message}`, () => render(root, params));
  }
}

async function loadContext() {
  const materials = await getKV('materials');
  // Hannah's identity is fixed in hannah.js — never trust a stale JD-parsed
  // profile (an old onboarding could have inferred L5 and saved it).
  return {
    profile: null,
    roleFamily: PROFILE.role,
    materialsText: materialsToText(materials),
    level: PROFILE.level,
  };
}

function stage(root, inner) {
  root.innerHTML = `<div class="glass session-stage screen-enter" style="max-width:760px;margin:0 auto">${inner}</div>`;
  return root.firstElementChild;
}

function failStage(root, msg, retry) {
  const v = stage(root, `<p class="muted" style="max-width:420px">${esc(msg)}</p>
    <div class="row" style="margin-top:18px">
      <button class="btn quiet" id="home">Back to dashboard</button>
      <button class="btn" id="retry">Try again</button>
    </div>`);
  v.querySelector('#home').onclick = () => navigate('dashboard');
  v.querySelector('#retry').onclick = retry;
}

/* ---------- practice picker ---------- */

function pickerStage(root) {
  const all = allQuestions();
  const n = c => all.filter(x => x.category === c).length;
  const opts = [
    { cat: '', label: 'Mixed', sub: 'A bit of everything', count: all.length },
    { cat: 'behavioral', label: 'Behavioral', sub: 'Tell me about a time…', count: n('behavioral') },
    { cat: 'hypothetical', label: 'Hypothetical', sub: 'How would you handle…', count: n('hypothetical') },
    { cat: 'opener', label: 'Opener', sub: 'Tell me about yourself · why Gemini', count: n('opener') },
  ];
  const v = stage(root, `
    <span class="tiny" style="text-transform:uppercase;letter-spacing:.05em;font-weight:650">Practice</span>
    <div class="session-q" style="margin-top:6px">What do you want to practice?</div>
    <div class="pick-list">
      ${opts.map(o => `<button class="pick-row" data-cat="${esc(o.cat)}">
        <span class="pick-label">${esc(o.label)}</span>
        <span class="pick-sub">${esc(o.sub)}</span>
        <span class="pick-n">${o.count}</span>
      </button>`).join('')}
    </div>
  `);
  v.querySelectorAll('.pick-row').forEach(b => {
    b.onclick = () => {
      const cat = b.dataset.cat;
      render(root, cat ? { category: cat, lock: true } : {});
    };
  });
}

/* ---------- think ---------- */

function thinkStage(root, ctx, q) {
  const C = 2 * Math.PI * 44;
  const story = q.targetStoryId ? storyById(q.targetStoryId) : null;
  const drillBanner = story ? `
    <div class="drill-banner">
      <span class="drill-chip">⚡️ Story drill</span>
      <span class="drill-aim">Land this story: <b>${esc(story.title)}</b></span>
    </div>` : '';
  const peek = story ? `
    <details class="drill-peek">
      <summary>Peek at your hook</summary>
      <p class="drill-hook">${esc(story.hook)}</p>
      <p class="drill-metric">${esc(story.metric)}</p>
    </details>` : '';
  const v = stage(root, `
    ${drillBanner}
    <span class="tiny" style="text-transform:uppercase;letter-spacing:.05em;font-weight:650">${esc(CATEGORIES[q.category])}</span>
    <div class="session-q">${esc(q.question)}</div>
    ${peek}
    <div class="ring-wrap">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle class="ring-track" cx="48" cy="48" r="44" fill="none" stroke-width="5"/>
        <circle class="ring-fill" id="ring" cx="48" cy="48" r="44" fill="none" stroke-width="5"
          stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0"/>
      </svg>
      <div class="ring-num" id="num">${THINK_SECONDS}</div>
    </div>
    <p class="tiny">Think time — gather your story</p>
    <div class="row" style="margin-top:22px">
      <button class="btn" id="now">Start answering now</button>
    </div>
    <button class="linkish" id="typed" style="margin-top:10px">Type your answer instead</button>
    <button class="linkish" id="skip-q" style="margin-top:6px" title="${story ? 'Different question for this story' : 'A different question'}">Skip Question →</button>
  `);

  rec = new Recorder();
  let micError = null;
  const micReady = rec.prepare().then(() => true).catch(e => { micError = e; return false; });

  let t = THINK_SECONDS;
  const ring = v.querySelector('#ring');
  const num = v.querySelector('#num');
  const go = async () => {
    clears.forEach(fn => fn()); clears = [];
    if (await micReady) { recordStage(root, ctx, q); }
    else {
      showError(micError || { kind: 'mic-other' }, [
        { id: 'type', label: 'Type my answer instead', fn: () => typedStage(root, ctx, q) },
      ]);
    }
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
    typedStage(root, ctx, q);
  };
  v.querySelector('#skip-q').onclick = () => {
    clears.forEach(fn => fn()); clears = [];
    rec?.dispose(); rec = null;
    // Drill stays on its story; a type-locked Practice stays in that type;
    // a Mixed Practice flips across the WHOLE bank.
    render(root,
      q.targetStoryId ? { targetStoryId: q.targetStoryId }
      : q.lock ? { category: q.category, lock: true }
      : {});
  };
}

/* ---------- record ---------- */

function recordStage(root, ctx, q) {
  const v = stage(root, `
    <p class="session-intent" style="max-width:560px">${esc(q.question)}</p>
    <canvas id="wave" width="840" height="112"></canvas>
    <div class="bigtimer" id="timer">0:00</div>
    <p class="target-hint" id="tzone">Target: 1–2.5 min</p>
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
      levels.forEach((l, i) => {
        const h = Math.max(4, l * canvas.height * 0.92);
        const x = canvas.width - (levels.length - i) * (bw + gap);
        cx.beginPath();
        cx.roundRect(x, mid - h / 2, bw, h, 3);
        cx.fill();
      });
    },
  });

  const started = Date.now();
  const timer = v.querySelector('#timer');
  const tzone = v.querySelector('#tzone');
  every(() => {
    const sec = Math.floor((Date.now() - started) / 1000);
    timer.textContent = fmtClock(sec);
    const inZone = sec >= 60 && sec <= 150;
    const over = sec > 150;
    timer.classList.toggle('target', inZone);
    timer.classList.toggle('over', over);
    if (tzone) {
      tzone.classList.toggle('active', inZone);
      tzone.textContent = over ? 'Consider wrapping up' : inZone ? '✓ In the sweet spot' : 'Target: 1–2.5 min';
    }
  }, 500);

  v.querySelector('#stop').onclick = async () => {
    clears.forEach(fn => fn()); clears = [];
    const r = rec;
    rec = null;
    const { blob, transcript, durationSec } = await r.stop();
    if (durationSec < 8) {
      toast('That was under 8 seconds — give it a real attempt.', 'err');
      thinkStage(root, ctx, q);
      return;
    }
    if (!transcript) {
      toast("Couldn't transcribe the audio — paste or type what you said.", 'err');
      typedStage(root, ctx, q, { blob, durationSec });
      return;
    }
    reviewStage(root, ctx, q, { blob, transcript, durationSec });
  };
}

/* ---------- review (submit or retry) ---------- */

function reviewStage(root, ctx, q, ans) {
  const v = stage(root, `
    <p class="session-intent" style="max-width:560px">${esc(q.question)}</p>
    <div class="row" style="margin-top:28px">
      <button class="btn quiet" id="retry">Record again</button>
      <button class="btn" id="submit">Submit for grading</button>
    </div>
  `);
  v.querySelector('#submit').onclick = () => gradeStage(root, ctx, q, ans);
  v.querySelector('#retry').onclick = () => thinkStage(root, ctx, q);
}

/* ---------- typed fallback ---------- */

function typedStage(root, ctx, q, prior = {}) {
  const v = stage(root, `
    <p class="session-intent" style="max-width:560px">${esc(q.question)}</p>
    <textarea id="ans" rows="9" style="max-width:620px;margin-top:18px;text-align:left"
      placeholder="${prior.blob ? 'Paste or type what you said…' : 'Type your answer as you would say it out loud…'}"></textarea>
    <div class="row" style="margin-top:16px">
      <button class="btn quiet" id="home">Cancel</button>
      <button class="btn" id="grade">Grade my answer</button>
    </div>
  `);
  v.querySelector('#home').onclick = () => navigate('dashboard');
  v.querySelector('#grade').onclick = () => {
    const transcript = v.querySelector('#ans').value.trim();
    if (transcript.split(/\s+/).length < 25) {
      toast('Give it a real attempt — at least a few sentences.', 'err');
      return;
    }
    const words = transcript.split(/\s+/).length;
    const durationSec = prior.durationSec || Math.round((words / 150) * 60);
    gradeStage(root, ctx, q, { blob: prior.blob || null, transcript, durationSec });
  };
}

/* ---------- grade & save ---------- */

async function gradeStage(root, ctx, q, ans) {
  const provider = getSettings().provider === 'openai' ? 'ChatGPT' : 'Claude';
  stage(root, `<div class="spin"></div>
    <p class="muted" style="margin-top:16px">${esc(provider)} is reading your answer…</p>
    <p class="tiny">Scoring against the ${esc(ctx.level)} bar</p>`);

  const words = ans.transcript.split(/\s+/).length;
  const wpm = Math.round(words / (ans.durationSec / 60)) || 0;
  const fillers = countFillers(ans.transcript);

  try {
    const { system, user } = gradePrompts({
      ...ctx,
      question: q.question,
      category: q.category,
      transcript: ans.transcript,
      durationSec: ans.durationSec,
      wpm,
      fillers,
      targetStory: q.targetStoryId ? storyById(q.targetStoryId) : null,
    });
    const g = await chatJSON(system, user, { maxTokens: 6000 });

    const session = {
      id: crypto.randomUUID(),
      ts: Date.now(),
      category: q.category,
      question: q.question,
      intent: q.intent || '',
      questionId: hashQuestion(q.question),
      retryOf: q.retryOf || null,
      targetStoryId: q.targetStoryId || null,
      storyLanded: q.targetStoryId ? (g.storyLanded || null) : null,
      storyNote: q.targetStoryId ? (g.storyNote || '') : '',
      practiceMode: q.lock ? q.category : null,
      level: ctx.level,
      transcript: ans.transcript,
      durationSec: ans.durationSec,
      wpm,
      fillers,
      score: clamp10(g.score),
      verdict: g.verdict || '',
      subscores: {
        structure: clamp10(g.subscores?.structure),
        specificity: clamp10(g.subscores?.specificity),
        relevance: clamp10(g.subscores?.relevance),
        delivery: clamp10(g.subscores?.delivery),
      },
      great: (g.great || []).slice(0, 3),
      errors: (g.errors || []).slice(0, 3),
      strengthTags: (g.strengthTags || []).slice(0, 3),
      rewrite: g.rewrite || '',
      annotations: (g.annotations || []).slice(0, 4),
    };

    await saveSession(session);
    if (ans.blob && ans.blob.size) await saveAudio(session.id, ans.blob);
    navigate('report', { id: session.id, fresh: true });
  } catch (e) {
    showError(e, [
      { id: 'retry', label: 'Try grading again', fn: () => gradeStage(root, ctx, q, ans) },
      { id: 'home',  label: 'Back to dashboard',  fn: () => navigate('dashboard') },
    ]);
  }
}

const clamp10 = n => Math.max(0, Math.min(10, Number(n) || 0));

// Re-ask an old question (retry & compare).
export async function retryParamsFor(sessionId) {
  const s = await getSession(sessionId);
  return {
    category: s.category,
    question: s.question,
    intent: s.intent,
    retryOf: s.id,
    targetStoryId: s.targetStoryId || undefined,
  };
}
