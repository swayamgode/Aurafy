// Spatial Ambience Audio Synthesizer (Web Audio API)
// Synthesizes stadium concert crowd murmur & cheer, or peaceful lofi campfire crackle & crickets
// 100% self-contained — no external audio files required, works offline.

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private currentType: "concert" | "lofi" | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: { stop?: () => void; disconnect: () => void }[] = [];

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public start(type: "concert" | "lofi", volume: number = 0.25) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.stop();
    this.isRunning = true;
    this.currentType = type;

    const master = ctx.createGain();
    master.gain.setValueAtTime(volume, ctx.currentTime);
    master.connect(ctx.destination);
    this.masterGain = master;

    if (type === "concert") {
      this.startConcertAmbience(ctx, master);
    } else {
      this.startLofiAmbience(ctx, master);
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public stop() {
    this.activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch (_) {}
    });
    this.activeNodes = [];
    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch (_) {}
      this.masterGain = null;
    }
    this.isRunning = false;
    this.currentType = null;
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  public getType(): "concert" | "lofi" | null {
    return this.currentType;
  }

  // --- CONCERT STADIUM AMBIENCE ---
  // Synthesizes low stadium crowd hum, airy room resonance, and distant cheers
  private startConcertAmbience(ctx: AudioContext, destination: AudioNode) {
    // 1. Pink noise crowd rumble generator
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to sound like distant roar
    const crowdFilter = ctx.createBiquadFilter();
    crowdFilter.type = "bandpass";
    crowdFilter.frequency.setValueAtTime(320, ctx.currentTime);
    crowdFilter.Q.setValueAtTime(1.2, ctx.currentTime);

    const crowdGain = ctx.createGain();
    crowdGain.gain.setValueAtTime(0.4, ctx.currentTime);

    whiteNoise.connect(crowdFilter);
    crowdFilter.connect(crowdGain);
    crowdGain.connect(destination);

    whiteNoise.start();
    this.activeNodes.push(whiteNoise, crowdFilter, crowdGain);

    // 2. Periodic distant crowd cheer surges
    const cheerTimer = setInterval(() => {
      if (!this.isRunning || this.currentType !== "concert") {
        clearInterval(cheerTimer);
        return;
      }
      try {
        const surge = ctx.createBufferSource();
        surge.buffer = noiseBuffer;
        const surgeFilter = ctx.createBiquadFilter();
        surgeFilter.type = "bandpass";
        surgeFilter.frequency.setValueAtTime(450 + Math.random() * 300, ctx.currentTime);
        surgeFilter.Q.setValueAtTime(2.0, ctx.currentTime);

        const surgeGain = ctx.createGain();
        const now = ctx.currentTime;
        surgeGain.gain.setValueAtTime(0.01, now);
        surgeGain.gain.linearRampToValueAtTime(0.25, now + 1.5);
        surgeGain.gain.exponentialRampToValueAtTime(0.01, now + 4.0);

        surge.connect(surgeFilter);
        surgeFilter.connect(surgeGain);
        surgeGain.connect(destination);

        surge.start(now);
        surge.stop(now + 4.2);
      } catch (_) {}
    }, 7000);

    this.activeNodes.push({
      disconnect: () => clearInterval(cheerTimer),
    });
  }

  // --- LOFI NIGHT MOUNTAIN AMBIENCE ---
  // Synthesizes crackling campfire pops, soothing breeze, and gentle crickets
  private startLofiAmbience(ctx: AudioContext, destination: AudioNode) {
    // 1. Soft night wind / rustling breeze
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const windSource = ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.setValueAtTime(240, ctx.currentTime);

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.18, ctx.currentTime);

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(destination);

    windSource.start();
    this.activeNodes.push(windSource, windFilter, windGain);

    // 2. Campfire Crackle & Pop impulses
    const crackleInterval = setInterval(() => {
      if (!this.isRunning || this.currentType !== "lofi") {
        clearInterval(crackleInterval);
        return;
      }
      try {
        // Random short snap/crackle
        const click = ctx.createBufferSource();
        const clickBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
        const data = clickBuf.getChannelData(0);
        for (let j = 0; j < data.length; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ctx.sampleRate * 0.008));
        }
        click.buffer = clickBuf;

        const snapFilter = ctx.createBiquadFilter();
        snapFilter.type = "highpass";
        snapFilter.frequency.setValueAtTime(800 + Math.random() * 1200, ctx.currentTime);

        const snapGain = ctx.createGain();
        snapGain.gain.setValueAtTime(0.08 + Math.random() * 0.15, ctx.currentTime);

        click.connect(snapFilter);
        snapFilter.connect(snapGain);
        snapGain.connect(destination);

        click.start();
      } catch (_) {}
    }, 180);

    this.activeNodes.push({
      disconnect: () => clearInterval(crackleInterval),
    });

    // 3. Gentle Crickets chirp oscillator
    const cricketInterval = setInterval(() => {
      if (!this.isRunning || this.currentType !== "lofi") {
        clearInterval(cricketInterval);
        return;
      }
      if (Math.random() > 0.4) {
        try {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(4500 + Math.random() * 400, ctx.currentTime);

          const now = ctx.currentTime;
          oscGain.gain.setValueAtTime(0, now);
          oscGain.gain.linearRampToValueAtTime(0.02, now + 0.02);
          oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc.connect(oscGain);
          oscGain.connect(destination);

          osc.start(now);
          osc.stop(now + 0.15);
        } catch (_) {}
      }
    }, 600);

    this.activeNodes.push({
      disconnect: () => clearInterval(cricketInterval),
    });
  }
}

export const ambientAudio = new AmbientAudioEngine();
