class SpatialAudio {
  private ctx: AudioContext;
  private panners = new Map<string, PannerNode>();
  private listener: AudioListener;

  constructor() {
    this.ctx = new AudioContext();
    this.listener = this.ctx.listener;
  }

  updateListener(x: number, y: number, z: number, forwardX: number, forwardY: number, forwardZ: number) {
    this.listener.positionX.value = x;
    this.listener.positionY.value = y;
    this.listener.positionZ.value = z;
    this.listener.forwardX.value = forwardX;
    this.listener.forwardY.value = forwardY;
    this.listener.forwardZ.value = forwardZ;
  }

  createSource(key: string, buffer: AudioBuffer, pos: { x: number; y: number; z: number }) {
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const panner = this.ctx.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = 10;
    panner.maxDistance = 100;
    panner.rolloffFactor = 1;
    panner.positionX.value = pos.x;
    panner.positionY.value = pos.y;
    panner.positionZ.value = pos.z;

    source.connect(panner).connect(this.ctx.destination);
    source.start(0);

    this.panners.set(key, panner);
    return source;
  }

  updateSourcePosition(key: string, x: number, y: number, z: number) {
    const panner = this.panners.get(key);
    if (panner) {
      panner.positionX.value = x;
      panner.positionY.value = y;
      panner.positionZ.value = z;
    }
  }
}
