class AudioCompressor {
  private compressor: DynamicsCompressorNode;

  constructor(ctx: AudioContext) {
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    this.compressor.connect(ctx.destination);
  }

  get node(): DynamicsCompressorNode {
    return this.compressor;
  }
}
