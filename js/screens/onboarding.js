// First run only — a single, on-brand gate. Hannah's role, stories, and the
// whole game plan live in js/hannah.js, so there's nothing to "set up": she
// just drops in an API key once per browser and lands straight in her war room.
// (No generic "what job are you going for" flow — this tool is hers alone.)

import { el, esc, toast } from '../ui.js';
import { saveSettings, getSettings } from '../store.js';
import { PROFILE } from '../hannah.js';
import { navigate } from '../app.js';

async function validateKey(provider, key) {
  try {
    const [url, headers] = provider === 'openai'
      ? ['https://api.openai.com/v1/models', { 'Authorization': `Bearer ${key}` }]
      : ['https://api.anthropic.com/v1/models', { 'x-api-key': key, 'anthropic-version': '2023-06-01' }];
    const r = await fetch(url, { headers });
    if (r.status === 401 || r.status === 403) return 'invalid';
    return r.ok ? 'valid' : 'error';
  } catch { return 'error'; }
}

export async function render(root) {
  const s = getSettings();
  const state = {
    provider: s.provider || 'anthropic',
    anthropicKey: s.anthropicKey || '',
    openaiKey: s.openaiKey || '',
  };

  const v = el(`<div style="max-width:480px;margin:8vh auto 0">
    <div class="center" style="margin-bottom:20px">
      <div class="warmup-badge" style="margin:0 auto 14px">🎯 Gemini · ${esc(PROFILE.level)}</div>
      <h1>Your interview war room</h1>
      <p class="muted" style="margin-top:8px">Welcome, ${esc(PROFILE.name.split(' ')[0])}. Drop in your API key and let's get to work.</p>
    </div>
    <div class="glass card stack">
      <div class="segmented" id="seg">
        <button data-p="anthropic" class="${state.provider === 'anthropic' ? 'on' : ''}">Claude</button>
        <button data-p="openai" class="${state.provider === 'openai' ? 'on' : ''}">ChatGPT</button>
      </div>
      <input type="password" id="key" autocomplete="off" spellcheck="false">
      <p id="key-status" class="tiny" style="min-height:16px"></p>
      <p class="tiny">🔒 Stored only on this device. Sent only to ${state.provider === 'openai' ? 'OpenAI' : 'Anthropic'} when you practice.</p>
      <button class="btn" id="go">Enter the war room</button>
    </div>
  </div>`);

  const key = v.querySelector('#key');
  const statusEl = v.querySelector('#key-status');
  const syncKeyField = () => {
    key.placeholder = state.provider === 'openai' ? 'sk-…  (OpenAI API key)' : 'sk-ant-…  (Anthropic API key)';
    key.value = state.provider === 'openai' ? state.openaiKey : state.anthropicKey;
    statusEl.textContent = '';
    statusEl.className = 'tiny';
  };
  syncKeyField();

  key.addEventListener('blur', async () => {
    const k = key.value.trim();
    if (k.length < 20) return;
    statusEl.textContent = 'Checking…';
    statusEl.className = 'tiny';
    const result = await validateKey(state.provider, k);
    if (result === 'valid') { statusEl.textContent = '✓ Connected'; statusEl.className = 'tiny key-valid'; }
    else if (result === 'invalid') { statusEl.textContent = '✕ Key rejected — double-check it'; statusEl.className = 'tiny key-invalid'; }
    else { statusEl.textContent = 'Could not verify (network issue) — you can still continue'; statusEl.className = 'tiny'; }
  });

  v.querySelectorAll('#seg button').forEach(b => {
    b.onclick = () => {
      if (state.provider === 'openai') state.openaiKey = key.value.trim();
      else state.anthropicKey = key.value.trim();
      state.provider = b.dataset.p;
      v.querySelectorAll('#seg button').forEach(x => x.classList.toggle('on', x === b));
      syncKeyField();
    };
  });

  v.querySelector('#go').onclick = () => {
    const k = key.value.trim();
    if (k.length < 20) { toast('That API key looks too short.', 'err'); return; }
    if (state.provider === 'openai') state.openaiKey = k; else state.anthropicKey = k;
    saveSettings({
      provider: state.provider,
      anthropicKey: state.anthropicKey,
      openaiKey: state.openaiKey,
      onboarded: true,
    });
    navigate('dashboard');
  };

  root.innerHTML = '';
  root.appendChild(v);
}
