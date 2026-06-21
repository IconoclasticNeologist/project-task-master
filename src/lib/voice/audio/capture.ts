// Mic capture → PCM16 mono 16 kHz frames, base64-encoded.
//
// SAFETY: frames are produced, sent via the provided callback, and dropped.
// Nothing is recorded, buffered to disk, or retained beyond the immediate
// AudioWorklet processing window.

export interface CaptureHandle {
  stop: () => void;
  /** Best-effort RMS in [0,1] for VAD/UI. */
  readonly rms: number;
}

const WORKLET_SRC = `
class PCM16Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._sampleBuf = [];
  }
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const ch = input[0];
    let sum = 0;
    for (let i = 0; i < ch.length; i++) sum += ch[i] * ch[i];
    const rms = Math.sqrt(sum / ch.length);
    this._sampleBuf.push(...ch);
    // ~20ms chunks at 16kHz = 320 samples; we run at AudioContext rate
    // and downsample in the main thread for simplicity.
    if (this._sampleBuf.length >= 2048) {
      const chunk = new Float32Array(this._sampleBuf);
      this._sampleBuf = [];
      this.port.postMessage({ chunk, rms }, [chunk.buffer]);
    }
    return true;
  }
}
registerProcessor('pcm16-processor', PCM16Processor);
`;

function downsampleTo16k(input: Float32Array, inputRate: number): Int16Array {
  if (inputRate === 16000) {
    const out = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }
  const ratio = inputRate / 16000;
  const newLen = Math.floor(input.length / ratio);
  const out = new Int16Array(newLen);
  for (let i = 0; i < newLen; i++) {
    const s = Math.max(-1, Math.min(1, input[Math.floor(i * ratio)]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function int16ToBase64(buf: Int16Array): string {
  const bytes = new Uint8Array(buf.buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export async function startMicCapture(
  onFrame: (base64Pcm16: string) => void,
): Promise<CaptureHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
  });
  const AudioCtor =
    (window as unknown as { AudioContext: typeof AudioContext }).AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtor({ sampleRate: 16000 });
  const src = ctx.createMediaStreamSource(stream);
  const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: "text/javascript" }));
  await ctx.audioWorklet.addModule(url);
  const node = new AudioWorkletNode(ctx, "pcm16-processor");
  const handle = { rms: 0, stop: () => {} } as { rms: number; stop: () => void };
  node.port.onmessage = (e: MessageEvent<{ chunk: Float32Array; rms: number }>) => {
    handle.rms = e.data.rms;
    const pcm = downsampleTo16k(e.data.chunk, ctx.sampleRate);
    onFrame(int16ToBase64(pcm));
  };
  src.connect(node);
  // node not connected to destination — we don't want to echo mic to speakers.
  handle.stop = () => {
    try {
      node.disconnect();
      src.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
      URL.revokeObjectURL(url);
    } catch {
      // swallow — best-effort teardown
    }
  };
  return handle as CaptureHandle;
}
