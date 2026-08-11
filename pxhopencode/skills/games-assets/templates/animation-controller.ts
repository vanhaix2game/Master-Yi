import { AnimationMixer, AnimationAction } from "three";

class AnimationController {
  private mixer: AnimationMixer;
  private actions = new Map<string, AnimationAction>();
  private currentAction: AnimationAction | null = null;

  constructor(model: THREE.Object3D, animations: THREE.AnimationClip[]) {
    this.mixer = new AnimationMixer(model);
    for (const clip of animations) {
      const action = this.mixer.clipAction(clip);
      this.actions.set(clip.name.toLowerCase(), action);
    }
  }

  play(name: string, crossFade = 0.2) {
    const nextAction = this.actions.get(name);
    if (!nextAction || nextAction === this.currentAction) return;

    if (this.currentAction) {
      this.currentAction.fadeOut(crossFade);
    }

    nextAction.reset().fadeIn(crossFade).play();
    this.currentAction = nextAction;
  }

  update(delta: number) {
    this.mixer.update(delta);
  }
}
