type State = "idle" | "run" | "jump" | "attack" | "hurt" | "die";

class EntityStateMachine {
  private current: State = "idle";
  private timer = 0;
  private durations: Record<State, number> = {
    idle: 0, run: 0, jump: 500, attack: 400, hurt: 300, die: 600,
  };

  get state() { return this.current; }

  set(next: State) {
    if (this.current === "die") return;
    const valid: Record<State, State[]> = {
      idle:   ["run","jump","attack","hurt","die"],
      run:    ["idle","jump","attack","hurt","die"],
      jump:   ["idle","hurt","die"],
      attack: ["idle","hurt","die"],
      hurt:   ["idle","die"],
      die:    [],
    };
    if (!valid[this.current].includes(next)) return;
    this.current = next;
    this.timer = 0;
  }

  update(dt: number) {
    if (this.current === "die") return;
    this.timer += dt * 1000;
    const d = this.durations[this.current];
    if (d > 0 && this.timer >= d) this.set("idle");
  }
}
