interface Scene {
  name: string;
  init(): void;
  fixedUpdate(dt: number): void;
  render(alpha: number): void;
  destroy(): void;
}

class SceneManager {
  private scenes = new Map<string, Scene>();
  private current: Scene | null = null;
  private next: Scene | null = null;
  private transitioning = false;

  add(scene: Scene) {
    this.scenes.set(scene.name, scene);
  }

  switchTo(name: string) {
    this.next = this.scenes.get(name) ?? null;
    this.transitioning = true;
  }

  update(dt: number, alpha: number) {
    if (this.transitioning) {
      if (this.current) {
        this.current.destroy();
        this.current = null;
      }
      if (this.next) {
        this.next.init();
        this.current = this.next;
        this.next = null;
      }
      this.transitioning = false;
    }
    this.current?.fixedUpdate(dt);
    this.current?.render(alpha);
  }

  destroyAll() {
    for (const scene of this.scenes.values()) {
      scene.destroy();
    }
    this.scenes.clear();
    this.current = null;
  }
}
