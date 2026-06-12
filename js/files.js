// Parse the user's materials (resume, notes) entirely on-device.
// txt/md/csv/json read natively; PDF via pdf.js and DOCX via mammoth,
// both lazy-loaded from a CDN only when needed.

const TEXT_EXT = new Set(['txt', 'md', 'markdown', 'csv', 'json']);
const MAX_FILES = 20;
const MAX_CHARS_PER_FILE = 20000;

const loadedScripts = {};
function loadScript(src) {
  loadedScripts[src] ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Couldn't load ${src}`));
    document.head.appendChild(s);
  });
  return loadedScripts[src];
}

async function parsePDF(file) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
  const pdfjs = window.pdfjsLib;
  pdfjs.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let i = 1; i <= Math.min(doc.numPages, 25); i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map(it => it.str).join(' '));
  }
  return pages.join('\n');
}

async function parseDOCX(file) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
  const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

function ext(name) {
  return name.split('.').pop().toLowerCase();
}

export const supportedFile = name =>
  TEXT_EXT.has(ext(name)) || ext(name) === 'pdf' || ext(name) === 'docx';

export async function parseFiles(files) {
  const items = [];
  const skipped = [];
  for (const file of Array.from(files).slice(0, MAX_FILES)) {
    try {
      let text;
      const e = ext(file.name);
      if (TEXT_EXT.has(e)) text = await file.text();
      else if (e === 'pdf') text = await parsePDF(file);
      else if (e === 'docx') text = await parseDOCX(file);
      else { skipped.push(file.name); continue; }
      text = (text || '').replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS_PER_FILE);
      if (text) items.push({ name: file.name, text });
      else skipped.push(file.name);
    } catch {
      skipped.push(file.name);
    }
  }
  return { items, skipped };
}

export const canPickDirectory = () => 'showDirectoryPicker' in window;

export async function pickDirectoryFiles() {
  const dir = await window.showDirectoryPicker();
  const files = [];
  async function walk(handle, depth) {
    if (depth > 3 || files.length >= MAX_FILES) return;
    for await (const entry of handle.values()) {
      if (files.length >= MAX_FILES) return;
      if (entry.kind === 'file' && supportedFile(entry.name)) {
        files.push(await entry.getFile());
      } else if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
        await walk(entry, depth + 1);
      }
    }
  }
  await walk(dir, 0);
  return files;
}

export function materialsToText(materials) {
  return (materials || [])
    .map(m => `--- ${m.name} ---\n${m.text}`)
    .join('\n\n')
    .slice(0, 30000);
}
