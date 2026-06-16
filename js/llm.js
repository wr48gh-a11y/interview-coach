// Provider-agnostic LLM client. Claude = claude-sonnet-4-6 (adaptive thinking),
// ChatGPT = gpt-5.5 via the Responses API (reasoning effort: high).
// Keys never leave the browser except to the chosen provider's API.

import { getSettings } from './store.js';

export const MODELS = { anthropic: 'claude-sonnet-4-6', openai: 'gpt-5.5' };

export async function chat(system, user, { maxTokens = 4096 } = {}) {
  const s = getSettings();
  const provider = s.provider || 'anthropic';
  const key = provider === 'openai' ? s.openaiKey : s.anthropicKey;
  if (!key) { const e = new Error('No API key. Add one in Settings.'); e.kind = 'no-key'; throw e; }
  try {
    return await (provider === 'openai'
      ? openaiChat(key, system, user, maxTokens)
      : anthropicChat(key, system, user, maxTokens));
  } catch (e) {
    if (!e.kind && (e instanceof TypeError || e.message?.includes('fetch'))) {
      e.kind = 'network';
    }
    throw e;
  }
}

async function anthropicChat(key, system, user, maxTokens) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODELS.anthropic,
      max_tokens: maxTokens,
      thinking: { type: 'adaptive' },
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw apiError(data, res.status);
  return (data.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');
}

async function openaiChat(key, system, user, maxTokens) {
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODELS.openai,
      reasoning: { effort: 'high' },
      instructions: system,
      input: user,
      max_output_tokens: maxTokens,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw apiError(data, res.status);
  if (typeof data.output_text === 'string' && data.output_text) return data.output_text;
  const parts = [];
  for (const item of data.output || []) {
    if (item.type === 'message') {
      for (const c of item.content || []) {
        if (c.type === 'output_text') parts.push(c.text);
      }
    }
  }
  return parts.join('\n');
}

function apiError(data, status) {
  const msg = data?.error?.message || data?.message;
  const kind = !status ? 'network'
    : status === 401 ? 'bad-key'
    : status === 402 ? 'billing'
    : status === 429 ? 'rate-limit'
    : status >= 500  ? 'server-error'
    : 'server-error';
  const e = new Error(msg || (status ? `Request failed (HTTP ${status}).` : 'No internet connection.'));
  e.kind = kind;
  return e;
}

// Strip ASCII control characters (literal newlines/tabs inside JSON string
// values are the most common reason a model's JSON fails to parse). Built
// without a literal control-char regex so the source stays clean.
function stripControlChars(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    out += code < 32 ? ' ' : s[i];
  }
  return out;
}

export function extractJSON(text) {
  const cleaned = String(text).replace(/```(?:json)?/gi, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) {
    const e = new Error('The model returned an unexpected format — try again.');
    e.kind = 'parse';
    throw e;
  }
  const slice = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    // Repair common breakages: control chars inside strings, trailing commas.
    const repaired = stripControlChars(slice).replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(repaired);
  }
}

export async function chatJSON(system, user, opts) {
  const text = await chat(system, user, opts);
  try {
    return extractJSON(text);
  } catch {
    // One strict retry — most parse failures clear on a second pass.
    const retry = await chat(
      system,
      user + '\n\nIMPORTANT: Your previous reply was not valid JSON. Reply again with ONLY a single valid JSON object. Inside string values, use single quotes, never double quotes.',
      opts,
    );
    return extractJSON(retry);
  }
}
