class InputManager {
  keys = new Set<string>();
  justPressed = new Set<string>();
  mouse = { x: 0, y: 0, down: false, justDown: false };
  touches = new Map<number, { x: number; y: number }>();

  constructor() {
    if (typeof window === "undefined") return;

    window.addEventListener("keydown", (e) => {
      if (!this.keys.has(e.code)) this.justPressed.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.keys.clear());

    window.addEventListener("mousedown", () => {
      this.mouse.justDown = true;
      this.mouse.down = true;
    });
    window.addEventListener("mouseup", () => { this.mouse.down = false; });
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener("touchstart", (e) => {
      for (const t of e.changedTouches) {
        this.touches.set(t.identifier, { x: t.clientX, y: t.clientY });
        this.mouse.down = true;
      }
    });
    window.addEventListener("touchmove", (e) => {
      for (const t of e.changedTouches) {
        this.touches.set(t.identifier, { x: t.clientX, y: t.clientY });
      }
    });
    window.addEventListener("touchend", (e) => {
      for (const t of e.changedTouches) {
        this.touches.delete(t.identifier);
      }
      if (this.touches.size === 0) this.mouse.down = false;
    });
  }

  clearFrame() {
    this.justPressed.clear();
    this.mouse.justDown = false;
  }

  isDown(key: string): boolean { return this.keys.has(key); }
  isPressed(key: string): boolean { return this.justPressed.has(key); }
}
