// Finite State Machine cho mọi entity
type EntityState = "idle" | "run" | "jump" | "attack" | "hurt" | "die";

// SFX auto-map theo state transition
const SFX_MAP: Record<string, string> = {
  jump:   "jump",
  attack: "shoot",
  hurt:   "hurt",
  die:    "die",
};

interface StateConfig {
  animation: string;
  speed?: number;
  canMove?: boolean;
  canAttack?: boolean;
  duration?: number; // ms, 0 = infinite
  onEnter?: () => void;
  onExit?: () => void;
}

const STATE_MAP: Record<EntityState, StateConfig> = {
  idle:   { animation: "idle",   speed: 0,  canMove: true,  canAttack: true,  duration: 0 },
  run:    { animation: "run",    speed: 1,  canMove: true,  canAttack: true,  duration: 0 },
  jump:   { animation: "jump",   speed: 1,  canMove: true,  canAttack: false, duration: 500 },
  attack: { animation: "attack", speed: 0,  canMove: false, canAttack: false, duration: 400 },
  hurt:   { animation: "hurt",   speed: 0,  canMove: false, canAttack: false, duration: 300 },
  die:    { animation: "die",    speed: 0,  canMove: false, canAttack: false, duration: 600 },
};

class EntityFSM {
  private state: EntityState = "idle";
  private stateTimer = 0;
  private config: StateConfig;
  private onStateChange?: (from: EntityState, to: EntityState) => void;
  private playSound?: (key: string) => void;

  constructor(onChange?: (from: EntityState, to: EntityState) => void, sound?: (key: string) => void) {
    this.config = STATE_MAP.idle;
    this.onStateChange = onChange;
    this.playSound = sound;
  }

  setState(newState: EntityState) {
    if (newState === this.state) return;
    if (this.state === "die") return; // dead can't change

    const prev = this.state;
    this.config.onExit?.();
    this.state = newState;
    this.config = STATE_MAP[newState];
    this.stateTimer = 0;
    this.config.onEnter?.();
    this.onStateChange?.(prev, newState);
    // Auto-play SFX on state transition
    if (this.playSound && SFX_MAP[newState]) {
      this.playSound(SFX_MAP[newState]);
    }
  }

  update(dt: number): EntityState {
    if (this.config.duration > 0) {
      this.stateTimer += dt * 1000;
      if (this.stateTimer >= this.config.duration) {
        this.setState("idle");
      }
    }
    return this.state;
  }

  getState() { return this.state; }
  canMove() { return this.config.canMove; }
  canAttack() { return this.config.canAttack; }
  isDead() { return this.state === "die"; }
}
