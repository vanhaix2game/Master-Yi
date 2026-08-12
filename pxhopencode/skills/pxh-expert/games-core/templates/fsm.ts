type EntityState = "idle" | "run" | "jump" | "attack" | "hurt" | "die";

interface StateRule {
  animation: string;
  speed: number;
  canMove: boolean;
  canAttack: boolean;
  duration: number; // ms, 0 = infinite
  transitions: EntityState[];
}

const STATE_RULES: Record<EntityState, StateRule> = {
  idle:   { animation: "idle",   speed: 0,   canMove: true,  canAttack: true,  duration: 0,    transitions: ["run","jump","attack","hurt","die"] },
  run:    { animation: "run",    speed: 200, canMove: true,  canAttack: true,  duration: 0,    transitions: ["idle","jump","attack","hurt","die"] },
  jump:   { animation: "jump",   speed: 200, canMove: true,  canAttack: false, duration: 500,  transitions: ["idle","hurt","die"] },
  attack: { animation: "attack", speed: 0,   canMove: false, canAttack: false, duration: 400,  transitions: ["idle","hurt","die"] },
  hurt:   { animation: "hurt",   speed: 0,   canMove: false, canAttack: false, duration: 300,  transitions: ["idle","die"] },
  die:    { animation: "die",    speed: 0,   canMove: false, canAttack: false, duration: 600,  transitions: [] },
};

class FSM {
  private current: EntityState = "idle";
  private timer = 0;
  private locked = false;

  get state() { return this.current; }

  transition(to: EntityState) {
    if (this.locked) return;
    if (this.current === "die") return;
    const rule = STATE_RULES[this.current];
    if (!rule.transitions.includes(to)) return; // invalid transition
    this.current = to;
    this.timer = 0;
  }

  update(dt: number) {
    if (this.current === "die") return;
    this.timer += dt * 1000;
    const rule = STATE_RULES[this.current];
    if (rule.duration > 0 && this.timer >= rule.duration) {
      this.transition("idle");
    }
  }

  lock(ms: number) {
    this.locked = true;
    setTimeout(() => { this.locked = false; }, ms);
  }
}
