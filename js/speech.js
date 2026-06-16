// Microphone recording with live transcription (Web Speech API) and an
// audio-level feed for the waveform. Falls back gracefully where unsupported.

export const speechSupported = () =>
  !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export class Recorder {
  constructor() {
    this.active = false;
    this.transcript = '';
    this.onText = null;
  }

  // Ask for the mic early (during think time) so the permission prompt
  // doesn't eat into the answer. Throws a typed error on failure.
  async prepare() {
    if (!navigator.mediaDevices?.getUserMedia) {
      const e = new Error('Microphone not supported in this browser.');
      e.kind = 'mic-browser';
      throw e;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (raw) {
      const kind =
        raw.name === 'NotAllowedError'  ? 'mic-denied'    :
        raw.name === 'NotFoundError'    ? 'mic-not-found' :
        raw.name === 'NotReadableError' ? 'mic-in-use'    :
        'mic-other';
      const e = new Error(raw.message || raw.name);
      e.kind = kind;
      throw e;
    }
  }

  start({ onLevel } = {}) {
    this.chunks = [];
    this.transcript = '';
    this.startedAt = Date.now();
    this.active = true;

    this.rec = new MediaRecorder(this.stream);
    this.rec.ondataavailable = e => { if (e.data.size) this.chunks.push(e.data); };
    this.rec.start(1000);

    if (onLevel) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      const src = this.ctx.createMediaStreamSource(this.stream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      src.connect(this.analyser);
      const buf = new Uint8Array(this.analyser.frequencyBinCount);
      const loop = () => {
        if (!this.active) return;
        this.analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        onLevel(Math.sqrt(sum / buf.length));
        this.raf = requestAnimationFrame(loop);
      };
      loop();
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      this.sr = new SR();
      this.sr.continuous = true;
      this.sr.interimResults = true;
      this.sr.lang = navigator.language || 'en-US';
      this.sr.onresult = e => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) this.transcript += r[0].transcript + ' ';
          else interim += r[0].transcript;
        }
        this.onText?.(this.transcript, interim);
      };
      // Chrome stops recognition after pauses — restart while recording.
      this.sr.onend = () => {
        if (this.active) { try { this.sr.start(); } catch {} }
      };
      try { this.sr.start(); } catch {}
    }
  }

  async stop() {
    this.active = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    try { this.sr?.stop(); } catch {}

    const blob = await new Promise(resolve => {
      if (!this.rec || this.rec.state === 'inactive') {
        resolve(new Blob(this.chunks || [], { type: 'audio/webm' }));
        return;
      }
      this.rec.onstop = () =>
        resolve(new Blob(this.chunks, { type: this.rec.mimeType || 'audio/webm' }));
      this.rec.stop();
    });

    this.stream?.getTracks().forEach(t => t.stop());
    try { await this.ctx?.close(); } catch {}

    return {
      blob,
      transcript: this.transcript.trim(),
      durationSec: Math.max(1, Math.round((Date.now() - this.startedAt) / 1000)),
    };
  }

  // Hard teardown for navigation mid-recording: never leave the mic on.
  dispose() {
    this.active = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    try { this.sr?.stop(); } catch {}
    try { if (this.rec && this.rec.state !== 'inactive') this.rec.stop(); } catch {}
    this.stream?.getTracks().forEach(t => t.stop());
    try { this.ctx?.close(); } catch {}
  }
}
