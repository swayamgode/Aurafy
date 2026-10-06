/**
 * beatDetector.ts
 * Real-time beat detection using Web Audio API.
 * Taps into the existing audio element or AudioContext to detect
 * peaks/onsets in the frequency spectrum and drive block spawning.
 */

export interface BeatEvent {
  bpm: number;
  intensity: number; // 0–1 how strong the beat is
  time: number;      // AudioContext currentTime
}

type BeatCallback = (event: BeatEvent) => void;

class BeatDetector {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(0));
  private animFrame: number | null = null;

  // Beat detection state
  private prevEnergy = 0;
  private beatHistory: number[] = [];
  private lastBeatTime = 0;
  private bpmEstimate = 120;

  private callbacks: BeatCallback[] = [];

  connect(audioEl: HTMLAudioElement): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      // Reuse existing source if same element
      if (!this.source) {
        this.source = this.audioCtx.createMediaElementSource(audioEl);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 512;
        this.analyser.smoothingTimeConstant = 0.75;
        this.dataArray = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
    } catch (_) {
      // Some browsers disallow re-wrapping; fall back to timer mode
    }
  }

  onBeat(cb: BeatCallback): () => void {
    this.callbacks.push(cb);
    return () => {
      this.callbacks = this.callbacks.filter((c) => c !== cb);
    };
  }

  start(): void {
    if (this.animFrame) return;
    this.tick();
  }

  stop(): void {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  /** Estimated BPM from recent beat intervals */
  getBPM(): number {
    return this.bpmEstimate;
  }

  private tick = () => {
    this.animFrame = requestAnimationFrame(this.tick);

    if (!this.analyser || !this.audioCtx) {
      return;
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    // Sub-bass + bass energy (first ~6% bins ≈ 0–350Hz at 44kHz)
    let energy = 0;
    const bassEnd = Math.floor(this.dataArray.length * 0.06);
    for (let i = 0; i < bassEnd; i++) {
      energy += this.dataArray[i];
    }
    energy /= bassEnd;

    const now = this.audioCtx.currentTime;
    const delta = energy - this.prevEnergy;
    this.prevEnergy = energy;

    // Threshold: spike >= 20 units and 200ms gap
    if (delta > 20 && now - this.lastBeatTime > 0.2) {
      const interval = now - this.lastBeatTime;
      this.lastBeatTime = now;

      // Running BPM average
      this.beatHistory.push(interval);
      if (this.beatHistory.length > 8) this.beatHistory.shift();
      const avgInterval =
        this.beatHistory.reduce((a, b) => a + b, 0) / this.beatHistory.length;
      this.bpmEstimate = Math.round(60 / avgInterval);

      const intensity = Math.min(1, delta / 80);
      this.callbacks.forEach((cb) =>
        cb({ bpm: this.bpmEstimate, intensity, time: now })
      );
    }
  };

  private synthTimer: ReturnType<typeof setInterval> | null = null;

  startSyntheticBeats(bpm = 120): void {
    this.bpmEstimate = bpm;
    if (this.synthTimer) clearInterval(this.synthTimer);
    const interval = (60 / bpm) * 1000;
    this.synthTimer = setInterval(() => {
      const now = performance.now() / 1000;
      this.callbacks.forEach((cb) =>
        cb({ bpm: this.bpmEstimate, intensity: 0.6, time: now })
      );
    }, interval);
  }

  stopSyntheticBeats(): void {
    if (this.synthTimer) {
      clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
  }

  destroy(): void {
    this.stop();
    this.stopSyntheticBeats();
    this.callbacks = [];
  }
}

export const beatDetector = new BeatDetector();
