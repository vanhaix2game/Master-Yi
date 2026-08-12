export function createMockFSM(states: string[]) {
  let current = states[0];
  const transitions: { from: string; to: string }[] = [];

  return {
    get state() { return current; },
    setState(s: string) {
      const from = current;
      current = s;
      transitions.push({ from, to: s });
    },
    canTransition(from: string, to: string) {
      return states.includes(from) && states.includes(to);
    },
    getTransitionHistory() { return [...transitions]; },
    reset() { current = states[0]; transitions.length = 0; },
  };
}

export function createMockScene() {
  const children: any[] = [];
  return {
    add: (obj: any) => children.push(obj),
    remove: (obj: any) => { const i = children.indexOf(obj); if (i >= 0) children.splice(i, 1); },
    get children() { return [...children]; },
    destroy: () => { children.length = 0; },
  };
}

export function simulateKey(code: string, type: "down" | "up" = "down") {
  document.dispatchEvent(new KeyboardEvent(type === "down" ? "keydown" : "keyup", { code }));
}

export function wait(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export function createMockAudioContext() {
  return {
    state: "running",
    sampleRate: 44100,
    createBuffer: (channels: number, length: number, sr: number) => ({
      getChannelData: () => new Float32Array(length),
      numberOfChannels: channels,
      length,
      sampleRate: sr,
    }),
    createBufferSource: () => ({
      buffer: null,
      connect: () => {},
      start: () => {},
      stop: () => {},
    }),
    createGain: () => ({
      gain: { value: 1 },
      connect: () => {},
    }),
    createPanner: () => ({
      positionX: { value: 0 },
      positionY: { value: 0 },
      positionZ: { value: 0 },
      coneInnerAngle: 360,
      coneOuterAngle: 0,
      distanceModel: "inverse",
      refDistance: 10,
      maxDistance: 100,
      connect: () => {},
    }),
    destination: {},
    resume: async () => {},
  };
}
