class AnimationController3D {
  private mixer: THREE.AnimationMixer;
  private actions = new Map<string, THREE.AnimationAction>();
  private current: THREE.AnimationAction | null = null;

  private stateAnimMap: Record<string, string> = {
    idle: "Idle", run: "Running", jump: "Jump",
    attack: "Punch", hurt: "Hurt", die: "Death",
  };

  constructor(model: THREE.Object3D, animations: THREE.AnimationClip[]) {
    this.mixer = new THREE.AnimationMixer(model);
    for (const clip of animations) {
      const action = this.mixer.clipAction(clip);
      this.actions.set(clip.name, action);
    }
  }

  play(state: string, crossFade = 0.2) {
    const clipName = this.stateAnimMap[state] || "Idle";
    const next = this.actions.get(clipName);
    if (!next || next === this.current) return;

    if (this.current) this.current.fadeOut(crossFade);
    next.reset().fadeIn(crossFade).play();
    this.current = next;
  }

  update(delta: number) {
    this.mixer.update(delta);
  }
}
