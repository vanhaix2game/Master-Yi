class PositionalAudio3D {
  private ctx: AudioContext;
  private listener: AudioListener;
  private bufferCache = new Map<string, AudioBuffer>();

  constructor() {
    this.ctx = new AudioContext();
    this.listener = this.ctx.listener;
  }

  async loadBuffer(url: string): Promise<AudioBuffer> {
    if (this.bufferCache.has(url)) return this.bufferCache.get(url)!;
    const res = await fetch(url);
    const arrayBuf = await res.arrayBuffer();
    const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
    this.bufferCache.set(url, audioBuf);
    return audioBuf;
  }

  resume() {
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  updateListener(camera: THREE.PerspectiveCamera) {
    const pos = camera.position;
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    this.listener.positionX.value = pos.x;
    this.listener.positionY.value = pos.y;
    this.listener.positionZ.value = pos.z;
    this.listener.forwardX.value = dir.x;
    this.listener.forwardY.value = dir.y;
    this.listener.forwardZ.value = dir.z;
  }

  async playAt(url: string, position: THREE.Vector3, volume = 1) {
    this.resume();
    const buffer = await this.loadBuffer(url);
    const panner = this.ctx.createPanner();
    panner.positionX.value = position.x;
    panner.positionY.value = position.y;
    panner.positionZ.value = position.z;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 0;
    panner.distanceModel = "inverse";
    panner.refDistance = 10;
    panner.maxDistance = 100;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;

    source.connect(panner).connect(gain).connect(this.ctx.destination);
    source.start(0);
  }
}
