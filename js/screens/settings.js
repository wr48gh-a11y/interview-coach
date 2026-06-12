// Settings: provider + keys, target role (replace JD), materials, data
// export/import, and the big red clear-everything button.

import { el, esc, toast } from '../ui.js';
import { getSettings, saveSettings, getKV, setKV, delKV, exportData, importData, clearAll } from '../store.js';
import { chatJSON, MODELS } from '../llm.js';
import { jdPrompts } from '../prompts.js';
import { parseFiles, supportedFile } from '../files.js';
import { navigate, refreshNav } from '../app.js';

export async function render(root) {
  const s = getSettings();
  const profile = await getKV('profile');
  const roleFamily = await getKV('roleFamily');
  const materials = (await getKV('materials')) || [];

  const v = el(`<div class="stack screen-enter" style="max-width:620px;margin:0 auto">
    <div class="row between">
      <h1>Settings</h1>
      <button class="btn quiet small" id="done">Done</button>
    </div>

    <div class="glass card stack">
      <h3>Your coach</h3>
      <div class="segmented" id="seg">
        <button data-p="anthropic" class="${s.provider !== 'openai' ? 'on' : ''}">Claude</button>
        <button data-p="openai" class="${s.provider === 'openai' ? 'on' : ''}">ChatGPT</button>
      </div>
      <div>
        <div class="label">Claude API key <span class="tiny">(${MODELS.anthropic})</span></div>
        <input type="password" id="akey" value="${esc(s.anthropicKey || '')}" placeholder="sk-ant-…" autocomplete="off">
      </div>
      <div>
        <div class="label">ChatGPT API key <span class="tiny">(${MODELS.openai}, extended reasoning)</span></div>
        <input type="password" id="okey" value="${esc(s.openaiKey || '')}" placeholder="sk-…" autocomplete="off">
      </div>
      <p class="tiny">🔒 Stored only on this device. Sent only to the provider you select.</p>
      <div><button class="btn small" id="savekeys">Save</button></div>
    </div>

    <div class="glass card stack">
      <h3>Target role</h3>
      <div id="role-now">${profile
        ? `<p><b>${esc(profile.title || 'Unknown role')}</b> · ${esc(profile.team || 'Google')} · ${esc(profile.level || '')}</p>
           <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:8px">
             ${(profile.focusAreas || []).map(f => `<span class="chip">${esc(f)}</span>`).join('')}
           </div>`
        : `<p class="muted">No job posting yet — practicing general ${esc(roleFamily || 'Google')} questions.</p>`}
      </div>
      <details>
        <summary>${profile ? 'Replace the job posting' : 'Add a job posting'}</summary>
        <div class="stack" style="margin-top:12px">
          <textarea id="jd" rows="7" placeholder="Paste the new posting…"></textarea>
          <div><button class="btn small" id="parse">Analyze posting</button></div>
          <p class="tiny">Your session history is kept — new sessions are simply coached against the new role.</p>
        </div>
      </details>
    </div>

    <div class="glass card stack">
      <h3>Your materials</h3>
      <div class="stack" id="mats" style="gap:8px"></div>
      <input type="file" id="fi" multiple accept=".pdf,.docx,.txt,.md,.markdown,.csv,.json" hidden>
      <div><button class="btn quiet small" id="add">Add files</button></div>
    </div>

    <div class="glass card stack">
      <h3>Your data</h3>
      <p class="tiny">Everything lives in this browser. Export a backup before clearing site data or moving devices.</p>
      <div class="row" style="flex-wrap:wrap">
        <button class="btn quiet small" id="export">Export backup</button>
        <button class="btn quiet small" id="import">Import backup</button>
        <input type="file" id="impfile" accept=".json" hidden>
        <button class="btn danger small" id="wipe">Erase everything</button>
      </div>
    </div>
  </div>`);

  /* provider + keys */
  let provider = s.provider || 'anthropic';
  v.querySelectorAll('#seg button').forEach(b => {
    b.onclick = () => {
      provider = b.dataset.p;
      v.querySelectorAll('#seg button').forEach(x => x.classList.toggle('on', x === b));
    };
  });
  v.querySelector('#savekeys').onclick = () => {
    saveSettings({
      provider,
      anthropicKey: v.querySelector('#akey').value.trim(),
      openaiKey: v.querySelector('#okey').value.trim(),
    });
    toast('Saved.');
  };

  /* target role */
  v.querySelector('#parse').onclick = async e => {
    const jd = v.querySelector('#jd').value.trim();
    if (jd.length < 80) { toast('Paste the full posting first.', 'err'); return; }
    const btn = e.target;
    btn.disabled = true;
    btn.textContent = 'Analyzing…';
    try {
      const { system, user } = jdPrompts(jd);
      const profile = await chatJSON(system, user, { maxTokens: 2000 });
      await setKV('profile', profile);
      await setKV('rawJD', jd);
      toast(`Now coaching you for: ${profile.title} (${profile.level})`);
      refreshNav();
      render(root);
    } catch (err) {
      toast(err.message, 'err');
      btn.disabled = false;
      btn.textContent = 'Analyze posting';
    }
  };

  /* materials */
  const matsEl = v.querySelector('#mats');
  const fi = v.querySelector('#fi');
  const paintMats = () => {
    matsEl.innerHTML = materials.length
      ? materials.map((m, i) => `<div class="filerow">
          <span>📄</span><span class="name">${esc(m.name)}</span>
          <button class="linkish" data-rm="${i}">remove</button>
        </div>`).join('')
      : '<p class="tiny">Nothing added yet — your coach will work from the transcript alone.</p>';
    matsEl.querySelectorAll('[data-rm]').forEach(b => {
      b.onclick = async () => {
        materials.splice(+b.dataset.rm, 1);
        await setKV('materials', materials);
        paintMats();
      };
    });
  };
  paintMats();
  v.querySelector('#add').onclick = () => fi.click();
  fi.onchange = async () => {
    const usable = Array.from(fi.files).filter(f => supportedFile(f.name));
    const { items, skipped } = await parseFiles(usable);
    materials.push(...items);
    await setKV('materials', materials);
    if (skipped.length) toast(`Couldn't read: ${skipped.join(', ')}`, 'err');
    paintMats();
  };

  /* data */
  v.querySelector('#export').onclick = async () => {
    const data = await exportData();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = `interview-coach-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast('Backup downloaded — keep it somewhere safe (it includes your API keys).');
  };
  const impfile = v.querySelector('#impfile');
  v.querySelector('#import').onclick = () => impfile.click();
  impfile.onchange = async () => {
    try {
      await importData(JSON.parse(await impfile.files[0].text()));
      toast('Backup restored.');
      refreshNav();
      navigate('dashboard');
    } catch (e) {
      toast(e.message, 'err');
    }
  };
  v.querySelector('#wipe').onclick = async () => {
    if (!confirm('Erase everything? Sessions, transcripts, materials, and keys — gone for good. Export a backup first if in doubt.')) return;
    await clearAll();
    location.reload();
  };

  v.querySelector('#done').onclick = () => navigate('dashboard');
  void delKV;

  root.innerHTML = '';
  root.appendChild(v);
}
