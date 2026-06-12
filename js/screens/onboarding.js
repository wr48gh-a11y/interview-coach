// Three-step onboarding: paste the posting (only required input), optional
// materials, connect an AI provider. The JD is parsed by the LLM at the end,
// once a key exists — silently, no confirmation screen.

import { el, esc, toast } from '../ui.js';
import { saveSettings, getSettings, setKV } from '../store.js';
import { chatJSON } from '../llm.js';

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
import { jdPrompts, ROLE_FAMILIES } from '../prompts.js';
import { parseFiles, pickDirectoryFiles, canPickDirectory, supportedFile } from '../files.js';
import { navigate } from '../app.js';

const state = { step: 1, rawJD: '', roleFamily: '', materials: [], provider: 'anthropic', anthropicKey: '', openaiKey: '' };

export async function render(root) {
  // Prefill anything already saved (e.g. a key added before onboarding).
  const s = getSettings();
  state.provider = s.provider || state.provider;
  state.anthropicKey = s.anthropicKey || state.anthropicKey;
  state.openaiKey = s.openaiKey || state.openaiKey;
  state.step = 1;
  paint(root);
}

function dots() {
  return `<div class="dots">${[1, 2, 3].map(i =>
    `<i class="${i <= state.step ? 'on' : ''}"></i>`).join('')}</div>`;
}

function paint(root) {
  root.innerHTML = '';
  const steps = { 1: stepJD, 2: stepMaterials, 3: stepKey };
  const view = steps[state.step](root);
  root.appendChild(view);
  view.classList.add('screen-enter');
}

/* ---------- step 1: job posting ---------- */

function stepJD(root) {
  const v = el(`<div style="max-width:580px;margin:4vh auto 0">
    <div class="center" style="margin-bottom:18px">
      <h1>What job are you going for?</h1>
      <p class="muted" style="margin-top:8px">Paste the Google posting. Role, level, and what they're really testing for — your coach works it out.</p>
    </div>
    <div class="glass card stack">
      <textarea id="jd" rows="9" placeholder="Paste the full job description here…">${esc(state.rawJD)}</textarea>
      <div class="row between">
        <button class="linkish" id="skip">No posting yet? Practice general questions</button>
        <button class="btn" id="next">Continue</button>
      </div>
    </div>
    ${dots()}
  </div>`);

  v.querySelector('#next').onclick = () => {
    state.rawJD = v.querySelector('#jd').value.trim();
    if (state.rawJD.length < 80) {
      toast('That looks too short to be a job posting — paste the whole thing, or skip.', 'err');
      return;
    }
    state.roleFamily = '';
    state.step = 2;
    paint(root);
  };

  v.querySelector('#skip').onclick = () => {
    state.rawJD = '';
    const card = v.querySelector('.glass');
    card.innerHTML = `<div class="label">Pick a role family instead</div>
      <div class="row" style="flex-wrap:wrap;gap:8px">
        ${ROLE_FAMILIES.map(r => `<button class="chip chip-accent" data-r="${esc(r)}">${esc(r)}</button>`).join('')}
      </div>`;
    card.querySelectorAll('[data-r]').forEach(b => {
      b.onclick = () => {
        state.roleFamily = b.dataset.r;
        state.step = 2;
        paint(root);
      };
    });
  };

  return v;
}

/* ---------- step 2: materials ---------- */

function stepMaterials(root) {
  const v = el(`<div style="max-width:580px;margin:4vh auto 0">
    <div class="center" style="margin-bottom:18px">
      <h1>Add your materials</h1>
      <p class="muted" style="margin-top:8px">Resume, notes, brag doc — your coach draws on your real experience. Optional.</p>
    </div>
    <div class="glass card stack">
      <div class="dropzone" id="dz">
        <div style="font-size:22px;margin-bottom:4px">↑</div>
        Drop files here, or click to choose<br>
        <span class="tiny">PDF, Word, text, markdown</span>
      </div>
      <input type="file" id="fi" multiple accept=".pdf,.docx,.txt,.md,.markdown,.csv,.json" hidden>
      ${canPickDirectory() ? '<button class="linkish" id="dir">…or connect a folder</button>' : ''}
      <div class="stack" id="list" style="gap:8px"></div>
      <p class="tiny">🔒 Read on this device only. Nothing is uploaded anywhere.</p>
      <div class="row between">
        <button class="linkish" id="back">Back</button>
        <div class="row">
          <button class="btn quiet" id="skip">Skip</button>
          <button class="btn" id="next">Continue</button>
        </div>
      </div>
    </div>
    ${dots()}
  </div>`);

  const list = v.querySelector('#list');
  const fi = v.querySelector('#fi');
  const dz = v.querySelector('#dz');

  const renderList = () => {
    list.innerHTML = state.materials.map((m, i) => `
      <div class="filerow">
        <span>📄</span><span class="name">${esc(m.name)}</span>
        <span class="tiny">${Math.round(m.text.length / 1000)}k chars</span>
        <button class="linkish" data-rm="${i}">remove</button>
      </div>`).join('');
    list.querySelectorAll('[data-rm]').forEach(b => {
      b.onclick = () => { state.materials.splice(+b.dataset.rm, 1); renderList(); };
    });
  };
  renderList();

  async function addFiles(files) {
    const usable = Array.from(files).filter(f => supportedFile(f.name));
    if (!usable.length) { toast('No supported files there (PDF, Word, text, markdown).', 'err'); return; }
    dz.textContent = 'Reading…';
    const { items, skipped } = await parseFiles(usable);
    state.materials.push(...items);
    if (skipped.length) toast(`Couldn't read: ${skipped.join(', ')}`, 'err');
    dz.innerHTML = '<div style="font-size:22px;margin-bottom:4px">↑</div>Drop more files, or click to choose<br><span class="tiny">PDF, Word, text, markdown</span>';
    renderList();
  }

  dz.onclick = () => fi.click();
  fi.onchange = () => addFiles(fi.files);
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); };
  dz.ondragleave = () => dz.classList.remove('over');
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove('over'); addFiles(e.dataTransfer.files); };
  v.querySelector('#dir')?.addEventListener('click', async () => {
    try { await addFiles(await pickDirectoryFiles()); } catch { /* user cancelled */ }
  });

  v.querySelector('#back').onclick = () => { state.step = 1; paint(root); };
  v.querySelector('#skip').onclick = () => { state.step = 3; paint(root); };
  v.querySelector('#next').onclick = () => { state.step = 3; paint(root); };
  return v;
}

/* ---------- step 3: provider + key ---------- */

function stepKey(root) {
  const v = el(`<div style="max-width:480px;margin:4vh auto 0">
    <div class="center" style="margin-bottom:18px">
      <h1>Connect your coach</h1>
      <p class="muted" style="margin-top:8px">Bring your own API key — Claude or ChatGPT.</p>
    </div>
    <div class="glass card stack">
      <div class="segmented" id="seg">
        <button data-p="anthropic" class="${state.provider === 'anthropic' ? 'on' : ''}">Claude</button>
        <button data-p="openai" class="${state.provider === 'openai' ? 'on' : ''}">ChatGPT</button>
      </div>
      <input type="password" id="key" autocomplete="off" spellcheck="false">
      <p id="key-status" class="tiny" style="min-height:16px"></p>
      <p class="tiny">🔒 Stored only on this device. Sent only to ${state.provider === 'openai' ? 'OpenAI' : 'Anthropic'} when you practice.</p>
      <div class="row between">
        <button class="linkish" id="back">Back</button>
        <button class="btn" id="go">Start practicing</button>
      </div>
    </div>
    ${dots()}
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
    else { statusEl.textContent = 'Could not verify (network issue)'; statusEl.className = 'tiny'; }
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

  v.querySelector('#back').onclick = () => { state.step = 2; paint(root); };

  v.querySelector('#go').onclick = async () => {
    const k = key.value.trim();
    if (k.length < 20) { toast('That API key looks too short.', 'err'); return; }
    if (state.provider === 'openai') state.openaiKey = k; else state.anthropicKey = k;

    saveSettings({
      provider: state.provider,
      anthropicKey: state.anthropicKey,
      openaiKey: state.openaiKey,
      onboarded: true,
    });
    await setKV('materials', state.materials);
    await setKV('roleFamily', state.roleFamily || 'General business');
    if (state.rawJD) await setKV('rawJD', state.rawJD);

    if (state.rawJD) {
      root.innerHTML = `<div class="session-stage glass" style="max-width:480px;margin:10vh auto 0">
        <div class="spin"></div>
        <p class="muted" style="margin-top:16px">Reading the posting — working out the role, level, and what they'll test…</p>
      </div>`;
      try {
        const { system, user } = jdPrompts(state.rawJD);
        const profile = await chatJSON(system, user, { maxTokens: 2000 });
        await setKV('profile', profile);
      } catch (e) {
        toast(`Couldn't analyze the posting yet (${e.message}) — you can retry from Settings.`, 'err');
      }
    }
    navigate('dashboard');
  };

  return v;
}
