export class HealthBar {
  private bar: Phaser.GameObjects.Graphics;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private maxHealth: number;
  private currentHealth: number;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, maxHealth: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.bar = scene.add.graphics();
    this.draw();
  }

  setHealth(health: number) {
    this.currentHealth = Math.max(0, health);
    this.draw();
  }

  private draw() {
    this.bar.clear();

    this.bar.fillStyle(0x333333);
    this.bar.fillRect(this.x, this.y, this.width, this.height);

    const ratio = this.currentHealth / this.maxHealth;
    const color = ratio > 0.5 ? 0x00ff00 : ratio > 0.25 ? 0xffff00 : 0xff0000;
    this.bar.fillStyle(color);
    this.bar.fillRect(this.x, this.y, this.width * ratio, this.height);

    this.bar.lineStyle(2, 0xffffff);
    this.bar.strokeRect(this.x, this.y, this.width, this.height);
  }
}
