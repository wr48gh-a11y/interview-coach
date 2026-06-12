// Session report: score + verdict, sub-score bars, top 3 great / top 3 errors,
// the 9/10 rewrite (open by default), annotated transcript, audio playback,
// retry & compare, next question, and the ask-your-coach interstitial.

import { el, esc, fmtClock, fmtDate, score1, toast } from '../ui.js';
import { getSession, getSessions, getAudio, getKV } from '../store.js';
import { chat, chatJSON } from '../llm.js';
import { CATEGORIES, coachChatPrompts, idealAnswerPrompts } from '../prompts.js';
import { navigate } from '../app.js';
import { retryParamsFor } from './session.js';

export async function render(root, { id, fresh } = {}) {
  const s = await getSession(id);
  if (!s) { navigate('dashboard'); return; }

  const previous = (await getSessions())
    .find(x => x.id !== s.id && x.questionId === s.questionId && x.ts < s.ts);

  const sub = (name, key) => {
    const n = s.subscores?.[key] ?? 0;
    return `<div class="subrow">
      <span class="nm">${name}</span>
      <div class="bar"><i class="${n < 6 ? 'weak' : ''}" style="width:0%" data-w="${n * 10}"></i></div>
      <span class="n">${n}</span>
    </div>`;
  };

  const t3 = (items, good) => items.map(it => `<div class="item">
      <span class="ic ${good ? 'good' : 'bad'}">${good ? '✓' : '✕'}</span>
      <span><b>${esc(it.title)}</b> — ${esc(it.detail)}</span>
    </div>`).join('');

  const delta = previous
    ? (s.score >= previous.score
      ? `<span class="delta up">▲ ${score1(s.score - previous.score)} vs your last attempt (${score1(previous.score)})</span>`
      : `<span class="delta down">▼ ${score1(previous.score - s.score)} vs your last attempt (${score1(previous.score)})</span>`)
    : '';

  const v = el(`<div class="stack screen-enter" style="max-width:760px;margin:0 auto">
    <div class="row between" style="padding:0 4px">
      <div>
        <span class="tiny" style="text-transform:uppercase;letter-spacing:.05em;font-weight:650">${esc(CATEGORIES[s.category] || s.category)} · ${fmtDate(s.ts)}${s.retryOf ? ' · retry' : ''}</span>
        <h2 style="margin-top:2px">${esc(s.question)}</h2>
      </div>
    </div>

    <div class="glass card">
      <div class="score-hero">
        <div>
          <span class="score-big">${score1(s.score)}</span><span class="hero-denom"> /10</span>
          <p style="font-weight:600;margin-top:4px">${esc(s.verdict)}</p>
          ${delta ? `<p style="margin-top:6px">${delta}</p>` : ''}
        </div>
        <div class="subscores">
          ${sub('Structure', 'structure')}
          ${sub('Specificity', 'specificity')}
          ${sub('Relevance', 'relevance')}
          ${sub('Delivery', 'delivery')}
        </div>
      </div>
      <hr class="sep">
      <div class="statchips">
        <span class="chip">⏱ ${fmtClock(s.durationSec)}${s.durationSec > 165 ? ' · long' : ''}</span>
        <span class="chip">${s.wpm} words/min</span>
        <span class="chip">${s.fillers} filler word${s.fillers === 1 ? '' : 's'}</span>
      </div>
      <div id="audio-slot"></div>
    </div>

    <div class="grid2">
      <div class="glass card">
        <h3>Top 3 things that were great</h3>
        <div class="t3">${t3(s.great || [], true)}</div>
      </div>
      <div class="glass card">
        <h3>Top 3 errors</h3>
        <div class="t3">${t3(s.errors || [], false)}</div>
      </div>
    </div>

    <div class="glass card coach-cta">
      <div>
        <p style="font-weight:650;font-size:15px">Want deeper coaching?</p>
        <p class="muted" style="margin-top:4px;font-size:13.5px">Specific feedback on your weaknesses and exactly how to fix them — then generate the ideal answer.</p>
      </div>
      <button class="btn" id="coach-btn">Ask your coach</button>
    </div>

    <div class="glass card">
      <h3>✨ Your answer, rewritten as a 9/10</h3>
      <p class="rewrite" style="margin-top:10px">${esc(s.rewrite)}</p>
    </div>

    <div class="glass card">
      <h3>Transcript</h3>
      <p class="transcript" style="margin-top:10px">${annotate(s.transcript, s.annotations)}</p>
      ${(s.annotations || []).length ? `<div class="notes">
        ${s.annotations.map(a => `<div class="note ${a.kind === 'good' ? 'good' : 'warn'}">
          <span class="dot"></span><span><b>"${esc(trim(a.quote, 60))}"</b> — ${esc(a.note)}</span>
        </div>`).join('')}
      </div>` : ''}
    </div>

    <div class="row" style="justify-content:center;padding:6px 0 10px;flex-wrap:wrap">
      <button class="btn quiet" id="home">Back to dashboard</button>
      <button class="btn quiet" id="retry">↻ Retry</button>
      <button class="btn" id="next-q">Next question →</button>
    </div>
  </div>`);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    v.querySelectorAll('.subrow .bar i').forEach(b => { b.style.width = b.dataset.w + '%'; });
  }));

  v.querySelector('#home').onclick = () => navigate('dashboard');
  v.querySelector('#retry').onclick = async () => navigate('session', await retryParamsFor(s.id));
  v.querySelector('#next-q').onclick = () => navigate('session', { category: s.category });
  v.querySelector('#coach-btn').onclick = () => openCoach(s);

  getAudio(s.id).then(blob => {
    if (!blob) return;
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = URL.createObjectURL(blob);
    v.querySelector('#audio-slot').appendChild(audio);
  });

  root.innerHTML = '';
  root.appendChild(v);
  if (fresh) window.scrollTo({ top: 0 });
}

/* ---------- coach interstitial ---------- */

async function openCoach(s) {
  const profile = await getKV('profile');
  const roleFamily = (await getKV('roleFamily')) || 'General business';

  const overlay = el(`<div class="coach-overlay">
    <div class="coach-modal glass">
      <div class="coach-header">
        <span>Your coach</span>
        <button class="iconbtn" id="cclose" style="font-size:16px">✕</button>
      </div>
      <div class="coach-messages" id="cmsg"></div>
      <div class="coach-offer" id="coffer" hidden>
        <span>Want to see what a great answer looks like?</span>
        <button class="btn small" id="cideal">Write ideal answer</button>
      </div>
      <div class="coach-input-row">
        <input type="text" id="cinput" placeholder="Ask a follow-up…" autocomplete="off">
        <button class="btn small" id="csend">Send</button>
      </div>
    </div>
  </div>`);

  document.body.appendChild(overlay);
  overlay.querySelector('#cclose').onclick = () => overlay.remove();
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  const msgs = overlay.querySelector('#cmsg');
  const offerEl = overlay.querySelector('#coffer');
  const input = overlay.querySelector('#cinput');

  const appendSpinner = () => {
    const sp = el(`<div class="coach-spin"><div class="spin"></div></div>`);
    msgs.appendChild(sp);
    msgs.scrollTop = msgs.scrollHeight;
    return sp;
  };

  const fetchCoachMsg = async (userMsg, isFirst) => {
    if (!isFirst && userMsg) {
      msgs.appendChild(el(`<div class="coach-msg user">${esc(userMsg)}</div>`));
    }
    const spinner = appendSpinner();
    try {
      const { system, user } = coachChatPrompts({
        profile, roleFamily, level: s.level,
        question: s.question, category: s.category,
        transcript: s.transcript, score: s.score,
        subscores: s.subscores, errors: s.errors, great: s.great,
        userMessage: userMsg, isFirst,
      });
      const text = await chat(system, user, { maxTokens: 1200 });
      spinner.remove();
      msgs.appendChild(el(`<div class="coach-msg">${esc(text)}</div>`));
      offerEl.hidden = false;
    } catch (e) {
      spinner.remove();
      msgs.appendChild(el(`<p class="tiny" style="color:var(--red);padding:8px 0">${esc(e.message)}</p>`));
    }
    msgs.scrollTop = msgs.scrollHeight;
  };

  overlay.querySelector('#cideal').onclick = async () => {
    offerEl.hidden = true;
    const spinner = appendSpinner();
    try {
      const { system, user } = idealAnswerPrompts({
        profile, roleFamily, level: s.level,
        question: s.question, category: s.category,
      });
      const result = await chatJSON(system, user, { maxTokens: 1000 });
      spinner.remove();
      msgs.appendChild(el(`<div class="coach-msg ideal-answer">
        <div class="ideal-label">Ideal answer</div>
        <div class="ideal-text">${esc(result.answer || '')}</div>
      </div>`));
    } catch (e) {
      spinner.remove();
      toast(e.message, 'err');
      offerEl.hidden = false;
    }
    msgs.scrollTop = msgs.scrollHeight;
  };

  overlay.querySelector('#csend').onclick = () => {
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    fetchCoachMsg(msg, false);
  };
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); overlay.querySelector('#csend').click(); }
  });

  fetchCoachMsg(null, true);
}

/* ---------- helpers ---------- */

function trim(t, n) {
  t = String(t || '');
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
}

function annotate(transcript, annotations) {
  let html = esc(transcript);
  for (const a of annotations || []) {
    const quote = esc(String(a.quote || '').trim());
    if (quote.length < 4) continue;
    const i = html.toLowerCase().indexOf(quote.toLowerCase());
    if (i === -1) continue;
    const original = html.slice(i, i + quote.length);
    html = html.slice(0, i) +
      `<mark class="${a.kind === 'good' ? 'good' : 'warn'}" title="${esc(a.note)}">${original}</mark>` +
      html.slice(i + quote.length);
  }
  return html;
}
