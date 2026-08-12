class SoundManager {
  private ctx: AudioContext;
  private bgmGain: GainNode;
  private sfxGain: GainNode;
  private bgmBuffer: AudioBuffer | null = null;
  private bgmSource: AudioBufferSourceNode | null = null;
  private sounds = new Map<string, AudioBuffer>();

  constructor() {
    this.ctx = new AudioContext();
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.3;
    this.bgmGain.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.ctx.destination);
  }

  // Load từ file, fallback procedural
  async loadSFX(key: string, url?: string) {
    if (url) {
      try {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        this.sounds.set(key, await this.ctx.decodeAudioData(buf));
        return;
      } catch { /* fallback */ }
    }
    // Procedural fallback
    this.sounds.set(key, this.generateSFX(key));
  }

  async loadBGM(url?: string) {
    if (url) {
      try {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        this.bgmBuffer = await this.ctx.decodeAudioData(buf);
        return;
      } catch { /* fallback */ }
    }
    this.bgmBuffer = this.generateBGM();
  }

  playSFX(key: string) {
    const buf = this.sounds.get(key);
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.sfxGain);
    src.start();
  }

  playBGM() {
    if (!this.bgmBuffer || this.bgmSource) return;
    this.bgmSource = this.ctx.createBufferSource();
    this.bgmSource.buffer = this.bgmBuffer;
    this.bgmSource.loop = true;
    this.bgmSource.connect(this.bgmGain);
    this.bgmSource.start();
  }

  stopBGM() {
    this.bgmSource?.stop();
    this.bgmSource = null;
  }

  // === Procedural SFX generation ===
  private generateSFX(type: string): AudioBuffer {
    const sampleRate = this.ctx.sampleRate;
    const duration = 0.3;
    const length = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    switch (type) {
      case "shoot": case "laser":
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          data[i] = Math.sin(2 * Math.PI * (800 - t * 2000) * t) *
            Math.max(0, 1 - t / duration) * 0.5;
        }
        break;
      case "explosion": case "hit":
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          data[i] = (Math.random() * 2 - 1) *
            Math.max(0, 1 - t / duration) * 0.6;
        }
        break;
      case "jump":
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          data[i] = Math.sin(2 * Math.PI * (300 + t * 1500) * t) *
            Math.max(0, 1 - t / duration) * 0.4;
        }
        break;
      case "collect": case "coin":
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          data[i] = (Math.sin(2 * Math.PI * 880 * t) * 0.3 +
            Math.sin(2 * Math.PI * 1320 * t) * 0.2) *
            Math.max(0, 1 - t / duration);
        }
        break;
      case "hurt":
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          data[i] = Math.sin(2 * Math.PI * (200 - t * 500) * t) *
            Math.max(0, 1 - t / duration) * 0.5;
        }
        break;
      case "die":
        for (let i = 0; i < length * 2; i++) {
          const t = i / sampleRate;
          data[i] = Math.sin(2 * Math.PI * (400 - t * 800) * t) *
            Math.max(0, 1 - t / (duration * 2)) * 0.5;
        }
        break;
      default: // noise
        for (let i = 0; i < length; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.3;
        }
    }
    return buffer;
  }

  // === Procedural BGM ===
  private generateBGM(): AudioBuffer {
    const sampleRate = this.ctx.sampleRate;
    const duration = 8; // 8 second loop
    const length = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Simple melody loop
    const notes = [262, 294, 330, 349, 392, 349, 330, 294]; // C D E F G F E D
    const noteLen = duration / notes.length;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const noteIdx = Math.floor(t / noteLen) % notes.length;
      const freq = notes[noteIdx];
      // Square wave + envelope
      const phase = (freq * t) % 1;
      data[i] = (phase < 0.5 ? 0.3 : -0.3) *
        Math.min(1, (t % noteLen) * 4) * // attack
        Math.max(0, 1 - (t % noteLen) / noteLen * 0.5); // release
    }
    return buffer;
  }
}
