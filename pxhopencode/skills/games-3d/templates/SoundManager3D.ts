export class SoundManager3D {
  private ctx: AudioContext;
  private bgmGain: GainNode;
  private sfxGain: GainNode;
  private bgmBuffer: AudioBuffer | null = null;
  private bgmSource: AudioBufferSourceNode | null = null;
  private sounds = new Map<string, AudioBuffer>();
  private loaded = false;

  constructor() {
    this.ctx = new AudioContext();
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.3;
    this.bgmGain.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.ctx.destination);
  }

  async loadAll() {
    if (this.loaded) return;
    this.loaded = true;

    const sfxKeys = ["shoot", "explosion", "jump", "collect", "hurt", "die"];
    for (const key of sfxKeys) {
      try {
        const res = await fetch(`assets/audio/${key}.mp3`);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          this.sounds.set(key, await this.ctx.decodeAudioData(buf));
          continue;
        }
      } catch { /* fallback */ }
      this.sounds.set(key, this.generateSFX(key));
    }

    try {
      const res = await fetch("assets/audio/bgm.mp3");
      if (res.ok) {
        const buf = await res.arrayBuffer();
        this.bgmBuffer = await this.ctx.decodeAudioData(buf);
      }
    } catch { /* fallback */ }
    if (!this.bgmBuffer) this.bgmBuffer = this.generateBGM();
  }

  resume() {
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  playSFX(key: string) {
    this.resume();
    const buf = this.sounds.get(key);
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.sfxGain);
    src.start();
  }

  playBGM() {
    this.resume();
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

  private generateSFX(type: string): AudioBuffer {
    const sr = this.ctx.sampleRate;
    const dur = 0.3;
    const len = sr * dur;
    const buf = this.ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);

    switch (type) {
      case "shoot":
        for (let i = 0; i < len; i++) {
          const t = i / sr;
          d[i] = Math.sin(2 * Math.PI * (800 - t * 2000) * t) * Math.max(0, 1 - t / dur) * 0.5;
        }
        break;
      case "explosion": case "hit":
        for (let i = 0; i < len; i++) {
          const t = i / sr;
          d[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - t / dur) * 0.6;
        }
        break;
      case "jump":
        for (let i = 0; i < len; i++) {
          const t = i / sr;
          d[i] = Math.sin(2 * Math.PI * (300 + t * 1500) * t) * Math.max(0, 1 - t / dur) * 0.4;
        }
        break;
      case "collect":
        for (let i = 0; i < len; i++) {
          const t = i / sr;
          d[i] = (Math.sin(2 * Math.PI * 880 * t) * 0.3 + Math.sin(2 * Math.PI * 1320 * t) * 0.2) *
            Math.max(0, 1 - t / dur);
        }
        break;
      case "hurt":
        for (let i = 0; i < len; i++) {
          const t = i / sr;
          d[i] = Math.sin(2 * Math.PI * (200 - t * 500) * t) * Math.max(0, 1 - t / dur) * 0.5;
        }
        break;
      case "die":
        for (let i = 0; i < len * 2; i++) {
          const t = i / sr;
          d[i] = Math.sin(2 * Math.PI * (400 - t * 800) * t) * Math.max(0, 1 - t / (dur * 2)) * 0.5;
        }
        break;
    }
    return buf;
  }

  private generateBGM(): AudioBuffer {
    const sr = this.ctx.sampleRate;
    const dur = 8;
    const len = sr * dur;
    const buf = this.ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    const notes = [262, 294, 330, 349, 392, 349, 330, 294];
    const noteLen = dur / notes.length;

    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const freq = notes[Math.floor(t / noteLen) % notes.length];
      const phase = (freq * t) % 1;
      d[i] = (phase < 0.5 ? 0.3 : -0.3) *
        Math.min(1, (t % noteLen) * 4) *
        Math.max(0, 1 - (t % noteLen) / noteLen * 0.5);
    }
    return buf;
  }
}
