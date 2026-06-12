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
