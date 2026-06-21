// Sequential PCM playback for Coach speech.
//
// Gemini Live audio responses arrive as base64 PCM16 mono at 24 kHz. We
// decode, queue, and play through a single AudioContext. No retention.

export class PcmPlayer {
  private ctx: AudioContext | null = null;
  private nextStart = 0;
  private readonly sampleRate: number;

  constructor(sampleRate = 24000) {
    this.sampleRate = sampleRate;
  }

  private ensureCtx(): AudioContext {
    if (this.ctx) return this.ctx;
    const AudioCtor =
      (window as unknown as { AudioContext: typeof AudioContext }).AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtor({ sampleRate: this.sampleRate });
    this.nextStart = this.ctx.currentTime;
    return this.ctx;
  }

  enqueueBase64Pcm16(b64: string) {
    const ctx = this.ensureCtx();
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const pcm = new Int16Array(bytes.buffer);
    const f32 = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) f32[i] = pcm[i] / 0x8000;
    const buf = ctx.createBuffer(1, f32.length, this.sampleRate);
    buf.copyToChannel(f32, 0);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    const start = Math.max(ctx.currentTime, this.nextStart);
    src.start(start);
    this.nextStart = start + buf.duration;
  }

  stop() {
    try {
      void this.ctx?.close();
    } catch {
      // ignore
    }
    this.ctx = null;
    this.nextStart = 0;
  }
}
