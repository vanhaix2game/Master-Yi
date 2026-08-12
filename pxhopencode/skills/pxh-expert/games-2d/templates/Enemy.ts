type EnemyAI = "idle" | "patrol" | "chase" | "attack" | "hurt" | "die";

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private fsm = new EntityStateMachine();
  private speed = 80;
  private health = 2;
  private patrolDir = 1;
  private startX: number;
  private playerRef: Player | null = null;
  private detectionRange = 200;

  constructor(scene: Phaser.Scene, x: number, y: number, player?: Player) {
    super(scene, x, y, "enemy");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.startX = x;
    this.setCollideWorldBounds(true);
    this.playerRef = player ?? null;
  }

  update(_time: number, delta: number) {
    this.fsm.update(delta / 1000);
    if (this.fsm.state === "die") return;

    const dist = this.playerRef
      ? Phaser.Math.Distance.Between(this.x, this.y, this.playerRef.x, this.playerRef.y)
      : Infinity;

    if (dist < this.detectionRange && this.fsm.state === "patrol") {
      this.fsm.set("chase");
    } else if (dist >= this.detectionRange && this.fsm.state === "chase") {
      this.fsm.set("patrol");
    }

    if (this.fsm.state === "patrol") {
      this.setVelocityX(this.speed * this.patrolDir);
      if (this.x >= this.startX + 100) { this.patrolDir = -1; this.setFlipX(true); }
      else if (this.x <= this.startX - 100) { this.patrolDir = 1; this.setFlipX(false); }
    } else if (this.fsm.state === "chase" && this.playerRef) {
      const dir = this.playerRef.x > this.x ? 1 : -1;
      this.setVelocityX(this.speed * 1.5 * dir);
      this.setFlipX(dir < 0);
    } else {
      this.setVelocityX(0);
    }

    this.play(`enemy_${this.fsm.state}`, true);
  }

  takeDamage() {
    if (this.fsm.state === "die") return;
    this.health--;
    this.fsm.set("hurt");
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => this.clearTint());

    if (this.health <= 0) {
      this.fsm.set("die");
      this.scene.time.delayedCall(600, () => {
        this.scene.events.emit("enemy-killed", this);
        this.destroy();
      });
    }
  }
}
