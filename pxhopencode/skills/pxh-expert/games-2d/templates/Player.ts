export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fsm = new EntityStateMachine();
  private speed = 200;
  private health = 100;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private invincible = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player_sheet");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.attackKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update(_time: number, delta: number) {
    this.fsm.update(delta / 1000);

    if (!this.fsm.state) this.setVelocity(0, 0);

    if (this.fsm.state === "idle" || this.fsm.state === "run") {
      const vx = (this.cursors.right.isDown ? 1 : 0) - (this.cursors.left.isDown ? 1 : 0);
      const vy = this.cursors.up.isDown && this.body!.blocked.down ? -300 : this.body!.velocity.y;
      this.setVelocityX(vx * this.speed);
      if (vx !== 0) this.setFlipX(vx < 0);

      if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
        this.fsm.set("attack");
        this.scene.events.emit("player-attack");
      } else if (!this.body!.blocked.down) {
        this.fsm.set("jump");
      } else if (Math.abs(this.body!.velocity.x) > 10) {
        this.fsm.set("run");
      } else {
        this.fsm.set("idle");
      }
    }

    const animMap: Record<string, string> = {
      idle: "player_idle", run: "player_run", jump: "player_jump",
      attack: "player_attack", hurt: "player_hurt", die: "player_die",
    };
    this.play(animMap[this.fsm.state], true);
  }

  takeDamage(amount: number) {
    if (this.invincible || this.fsm.state === "die") return;
    this.health -= amount;
    this.fsm.set("hurt");
    this.invincible = true;
    this.scene.time.delayedCall(500, () => { this.invincible = false; });

    if (this.health <= 0) {
      this.fsm.set("die");
      this.scene.time.delayedCall(600, () => {
        this.scene.events.emit("player-died");
      });
    }
  }
}
