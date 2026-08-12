class ObjectPool<T> {
  private pool: T[] = [];
  private active = new Set<T>();
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 20) {
    this.factory = factory;
    this.reset = reset;
    for (let i = 0; i < initialSize; i++) this.pool.push(factory());
  }

  acquire(): T {
    const obj = this.pool.pop() ?? this.factory();
    this.active.add(obj);
    return obj;
  }

  release(obj: T) {
    if (this.active.delete(obj)) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  releaseAll() {
    for (const obj of this.active) {
      this.reset(obj);
      this.pool.push(obj);
    }
    this.active.clear();
  }

  get activeCount(): number { return this.active.size; }
  get poolSize(): number { return this.pool.length; }
}

// Sử dụng: bullet pool
interface Bullet { x: number; y: number; vx: number; vy: number; alive: boolean; }

const bulletPool = new ObjectPool<Bullet>(
  () => ({ x: 0, y: 0, vx: 0, vy: 0, alive: false }),
  (b) => { b.alive = false; },
  100
);
