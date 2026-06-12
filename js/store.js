// Local-first storage: settings in localStorage, everything else in IndexedDB.

const SKEY = 'gic-settings';
const AUDIO_KEEP = 10;

export function getSettings() {
  try { return JSON.parse(localStorage.getItem(SKEY) || '{}'); }
  catch { return {}; }
}

export function saveSettings(patch) {
  localStorage.setItem(SKEY, JSON.stringify({ ...getSettings(), ...patch }));
}

let dbPromise;
function db() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open('gic-db', 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      d.createObjectStore('kv');
      d.createObjectStore('sessions', { keyPath: 'id' });
      d.createObjectStore('audio');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(store, mode, fn) {
  return db().then(d => new Promise((resolve, reject) => {
    const t = d.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
  }));
}

export const getKV = key => tx('kv', 'readonly', s => s.get(key));
export const setKV = (key, val) => tx('kv', 'readwrite', s => s.put(val, key));
export const delKV = key => tx('kv', 'readwrite', s => s.delete(key));

export const saveSession = session => tx('sessions', 'readwrite', s => s.put(session));
export const getSession = id => tx('sessions', 'readonly', s => s.get(id));

export async function getSessions() {
  const all = await tx('sessions', 'readonly', s => s.getAll());
  return (all || []).sort((a, b) => b.ts - a.ts);
}

export async function saveAudio(id, blob) {
  await tx('audio', 'readwrite', s => s.put(blob, id));
  const keep = new Set((await getSessions()).slice(0, AUDIO_KEEP).map(s => s.id));
  const keys = await tx('audio', 'readonly', s => s.getAllKeys());
  for (const k of keys || []) {
    if (!keep.has(k)) await tx('audio', 'readwrite', s => s.delete(k));
  }
}

export const getAudio = id => tx('audio', 'readonly', s => s.get(id));

export async function exportData() {
  const kv = {};
  for (const key of ['profile', 'materials', 'roleFamily', 'rawJD']) {
    const v = await getKV(key);
    if (v !== undefined) kv[key] = v;
  }
  return {
    app: 'interview-coach',
    v: 1,
    exportedAt: new Date().toISOString(),
    settings: getSettings(),
    kv,
    sessions: await getSessions(),
  };
}

export async function importData(data) {
  if (data?.app !== 'interview-coach' || !data.v) {
    throw new Error('That file is not an Interview Coach backup.');
  }
  if (data.settings) localStorage.setItem(SKEY, JSON.stringify(data.settings));
  for (const [k, v] of Object.entries(data.kv || {})) await setKV(k, v);
  for (const s of data.sessions || []) await saveSession(s);
}

export async function clearAll() {
  localStorage.removeItem(SKEY);
  const d = await db();
  d.close();
  dbPromise = undefined;
  await new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase('gic-db');
    req.onsuccess = resolve;
    req.onerror = () => reject(req.error);
    req.onblocked = resolve;
  });
}
