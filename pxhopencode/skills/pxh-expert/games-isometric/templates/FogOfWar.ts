class FogOfWar {
  private fog: number[][];
  private visionRadius = 3;

  constructor(cols: number, rows: number) {
    this.fog = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => 0)
    );
  }

  update(playerX: number, playerY: number) {
    for (let y = -this.visionRadius; y <= this.visionRadius; y++) {
      for (let x = -this.visionRadius; x <= this.visionRadius; x++) {
        const dist = Math.sqrt(x * x + y * y);
        if (dist > this.visionRadius) continue;

        const tx = playerX + x;
        const ty = playerY + y;
        if (ty >= 0 && ty < this.fog.length &&
            tx >= 0 && tx < this.fog[0].length) {
          this.fog[ty][tx] = 2;
        }
      }
    }

    for (let y = 0; y < this.fog.length; y++) {
      for (let x = 0; x < this.fog[0].length; x++) {
        if (this.fog[y][x] === 2) {
          this.fog[y][x] = 3;
        }
      }
    }
  }

  isVisible(x: number, y: number): boolean {
    return this.fog[y]?.[x] === 2;
  }

  isExplored(x: number, y: number): boolean {
    return (this.fog[y]?.[x] ?? 0) >= 2;
  }
}
