// App shell: tiny screen router + the floating nav.

import { getSettings, getKV, setKV } from './store.js';
import { chatJSON } from './llm.js';
import { jdPrompts } from './prompts.js';
import { esc } from './ui.js';
import * as onboarding from './screens/onboarding.js';
import * as dashboard from './screens/dashboard.js';
import * as session from './screens/session.js';
import * as report from './screens/report.js';
import * as settings from './screens/settings.js';

const screens = { onboarding, dashboard, session, report, settings };
let current = null;

export async function navigate(name, params = {}) {
  // Never leave a previous screen's mic or timers running.
  current?.cleanup?.();
  current = screens[name];

  const nav = document.getElementById('nav');
  nav.hidden = name === 'onboarding';

  const root = document.getElementById('screen');
  root.innerHTML = '';
  window.scrollTo({ top: 0 });
  await current.render(root, params);
  if (name !== 'onboarding') refreshNav();
}

export async function refreshNav() {
  const chip = document.getElementById('navChip');
  const profile = await getKV('profile');
  const roleFamily = await getKV('roleFamily');
  const label = profile
    ? `🎯 ${profile.title || 'Target role'}${profile.level ? ' · ' + profile.level : ''}`
    : (roleFamily ? `🎯 ${roleFamily} · general` : '');
  chip.hidden = !label;
  chip.innerHTML = esc(label);
}

// If onboarding stored a posting but parsing failed (bad key, offline),
// quietly retry once per launch.
async function ensureProfile() {
  const rawJD = await getKV('rawJD');
  const profile = await getKV('profile');
  if (!rawJD || profile) return;
  try {
    const { system, user } = jdPrompts(rawJD);
    await setKV('profile', await chatJSON(system, user, { maxTokens: 2000 }));
    refreshNav();
  } catch { /* retried next launch */ }
}

function init() {
  document.getElementById('navSettings').onclick = () => navigate('settings');
  document.getElementById('navChip').onclick = () => navigate('settings');

  if (getSettings().onboarded) {
    navigate('dashboard');
    ensureProfile();
  } else {
    navigate('onboarding');
  }
}

if (typeof document !== 'undefined' && document.getElementById('screen')) init();
