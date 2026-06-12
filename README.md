# Interview Coach

A local-first Google interview coaching app for non-tech L5/L6 roles. Paste a job posting, practice spoken answers, get scored coaching from Claude or ChatGPT.

## Run it

No build step. Serve the folder over HTTP (ES modules and the microphone require it):

```sh
python3 -m http.server 8080
# then open http://localhost:8080
```

**Use Chrome for the full experience** — live speech-to-text (Web Speech API) and "connect a folder" (File System Access API) are Chromium features. In Safari/Firefox the app falls back to typed answers and file upload.

## How it works

- **Onboarding**: paste a job posting (the LLM infers role, level, and competencies), optionally add your resume/notes, then add a Claude or ChatGPT API key.
- **Practice**: 30s think time → record your answer (~2 min target) → the LLM grades it: score /10, sub-scores, top 3 strengths, top 3 errors, a "9/10 rewrite" of your own answer, and an annotated transcript.
- **Dashboard**: readiness score with trend, recurring strengths/errors across sessions, per-category averages, suggested next question, full history with retry-and-compare.

## Privacy

Everything stays in your browser: API keys in localStorage, sessions/transcripts/materials in IndexedDB, audio for the last 10 sessions only. Keys are sent only to api.anthropic.com or api.openai.com. Settings has one-click export/import for backups and device moves. Clearing browser site data deletes everything — export first.

## Models

- Claude: `claude-sonnet-4-6` with adaptive thinking
- ChatGPT: `gpt-5.5` (Responses API) with `reasoning.effort: "high"`
