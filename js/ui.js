// Small DOM + formatting helpers shared by all screens.

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function toast(msg, kind = '') {
  const box = document.getElementById('toasts');
  const t = el(`<div class="toast ${kind}">${esc(msg)}</div>`);
  box.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity 0.4s';
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 450);
  }, kind === 'err' ? 5200 : 3000);
}

export function fmtDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  const days = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()) -
    new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function fmtClock(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function score1(n) {
  return (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, '');
}

export function sparkline(scores, w = 150, h = 34) {
  if (scores.length < 2) return '';
  const pad = 3;
  const pts = scores.map((v, i) => {
    const x = pad + (i / (scores.length - 1)) * (w - pad * 2);
    const y = h - pad - (Math.max(0, Math.min(10, v)) / 10) * (h - pad * 2);
    return [x, y];
  });
  const last = pts[pts.length - 1];
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
    <polyline points="${pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ')}"/>
    <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.6"/>
  </svg>`;
}

export function countFillers(text) {
  const m = (text || '').toLowerCase().match(
    /\b(um+|uh+|erm|you know|kind of|sort of|i mean|basically|like)\b/g
  );
  return m ? m.length : 0;
}

export function hashQuestion(text) {
  let h = 0;
  for (const c of String(text)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return 'q' + (h >>> 0).toString(36);
}

const ERROR_DIAGNOSES = {
  'no-key':       { icon: '🔑', title: 'No API key',            fix: 'Open Settings and paste in your Claude or ChatGPT API key.' },
  'bad-key':      { icon: '🔑', title: 'API key rejected',       fix: 'Your key was rejected. Open Settings, delete it, and paste it again — check for extra spaces.' },
  'billing':      { icon: '💳', title: 'Billing issue',          fix: 'Your account has a payment problem. Check your billing at console.anthropic.com or platform.openai.com.' },
  'rate-limit':   { icon: '⏱', title: 'Rate limited',           fix: 'You\'ve hit the provider\'s limit. Wait 30 seconds and try again.' },
  'server-error': { icon: '☁️', title: 'Provider server error',  fix: 'The AI provider had a server error. Wait a moment and try again.' },
  'network':      { icon: '📡', title: 'No internet connection', fix: 'Can\'t reach the AI provider. Check your Wi-Fi or cellular connection, then try again.' },
  'parse':        { icon: '⚠️', title: 'Unexpected AI response', fix: 'The AI returned something it couldn\'t parse. Try again — it usually clears on a second attempt.' },
  'mic-denied':   { icon: '🎤', title: 'Microphone access blocked', fix: 'Click the 🔒 icon in your browser\'s address bar, set Microphone to Allow, then reload the page.' },
  'mic-not-found':{ icon: '🎤', title: 'No microphone found',    fix: 'No microphone was detected. Plug one in or check System Settings → Sound → Input.' },
  'mic-in-use':   { icon: '🎤', title: 'Microphone in use',      fix: 'Your mic is being used by another app. Quit Zoom, Teams, FaceTime, or similar, then try again.' },
  'mic-browser':  { icon: '🎤', title: 'Browser mic not supported', fix: 'This browser doesn\'t support microphone access. Open the app in Chrome or Safari.' },
  'mic-other':    { icon: '🎤', title: 'Microphone error',        fix: 'Couldn\'t start the microphone. Check System Settings → Sound → Input and make sure a mic is selected.' },
};

const KEY_ERROR_KINDS = new Set(['no-key', 'bad-key', 'billing']);

export function showError(kindOrError, primaryActions = []) {
  const kind = typeof kindOrError === 'string' ? kindOrError : (kindOrError?.kind || 'unknown');
  const raw   = typeof kindOrError === 'string' ? null : kindOrError;
  const d = ERROR_DIAGNOSES[kind] || { icon: '⚠️', title: 'Something went wrong', fix: raw?.message || 'An unexpected error occurred. Try refreshing the page.' };

  // Key/billing errors always get a direct Settings button injected.
  const actions = [...primaryActions];
  if (KEY_ERROR_KINDS.has(kind)) {
    actions.unshift({ id: 'settings', label: 'Open Settings', fn: () => import('./app.js').then(m => m.navigate('settings')) });
  }

  document.getElementById('err-overlay')?.remove();
  // Primary actions (first in list) get the solid btn style; rest are quiet.
  const actionHTML = actions.map((a, i) =>
    `<button class="btn ${i === 0 ? '' : 'quiet'} err-action" data-action="${esc(a.id)}">${esc(a.label)}</button>`
  ).join('');

  const overlay = el(`<div id="err-overlay" class="err-overlay">
    <div class="err-modal glass">
      <div class="err-icon">${d.icon}</div>
      <h3 class="err-title">${esc(d.title)}</h3>
      <p class="err-fix">${esc(d.fix)}</p>
      ${raw?.message && raw.message !== d.fix ? `<p class="err-raw">${esc(raw.message)}</p>` : ''}
      <div class="err-actions">
        ${actionHTML}
        <button class="btn quiet err-dismiss" id="err-dismiss">Dismiss</button>
      </div>
    </div>
  </div>`);
  overlay.querySelector('#err-dismiss').onclick = () => overlay.remove();
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  actions.forEach(a => {
    overlay.querySelector(`[data-action="${a.id}"]`)?.addEventListener('click', () => { overlay.remove(); a.fn(); });
  });
  document.body.appendChild(overlay);
}
