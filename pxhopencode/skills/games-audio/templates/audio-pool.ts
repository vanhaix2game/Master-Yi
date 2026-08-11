class AudioPool {
  private pool: AudioBufferSourceNode[] = [];
  private ctx: AudioContext;
  private masterGain: GainNode;
  private buffers = new Map<string, AudioBuffer>();
  private activeSources = new Set<AudioBufferSourceNode>();

  constructor() {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1;
    this.masterGain.connect(this.ctx.destination);
  }

  get masterVolume(): number {
    return this.masterGain.gain.value;
  }

  set masterVolume(v: number) {
    this.masterGain.gain.value = Math.max(0, Math.min(1, v));
  }

  async load(key: string, url: string): Promise<void> {
    const res = await fetch(url);
    const arrayBuf = await res.arrayBuffer();
    const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
    this.buffers.set(key, audioBuf);
  }

  play(key: string, options: { loop?: boolean; volume?: number; rate?: number } = {}): AudioBufferSourceNode {
    const buffer = this.buffers.get(key);
    if (!buffer) throw new Error(`Audio not loaded: ${key}`);

    const source = this.pool.pop() || this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop ?? false;
    source.playbackRate.value = options.rate ?? 1;

    const gain = this.ctx.createGain();
    gain.gain.value = options.volume ?? 1;

    source.connect(gain).connect(this.masterGain);
    source.start(0);
    source.onended = () => this.release(source);

    this.activeSources.add(source);

    setTimeout(() => {
      if (this.activeSources.has(source)) {
        this.release(source);
      }
    }, (buffer.duration * 1000) + 100);

    return source;
  }

  private release(source: AudioBufferSourceNode) {
    try { source.stop(); } catch {}
    source.disconnect();
    source.buffer = null;
    source.onended = null;
    this.activeSources.delete(source);
    this.pool.push(source);
  }

  stopAll() {
    for (const source of this.activeSources) {
      this.release(source);
    }
  }

  resume() {
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }
}
