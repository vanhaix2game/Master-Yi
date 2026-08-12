export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private healthBar!: HealthBar;

  constructor() { super("GameScene"); }

  create() {
    this.player = new Player(this, 400, 300);

    this.enemies = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: true,
    });

    this.bullets = this.physics.add.group({
      defaultKey: "bullet",
      maxSize: 30,
    });

    const platforms = this.physics.add.staticGroup();
    platforms.add(this.add.rectangle(400, 568, 800, 64, 0x666666));
    platforms.add(this.add.rectangle(200, 450, 200, 16, 0x666666));
    platforms.add(this.add.rectangle(600, 350, 200, 16, 0x666666));

    this.physics.add.collider(this.player, platforms);
    this.physics.add.collider(this.enemies, platforms);
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitEnemy, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerHitEnemy, undefined, this);

    this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => this.spawnEnemy(),
    });

    this.scoreText = this.add.text(16, 16, "Điểm: 0", {
      fontSize: "24px", color: "#ffffff",
    });
    this.healthBar = new HealthBar(this, 16, 48, 200, 20, 100);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.player.active) this.fireBullet(pointer.x, pointer.y);
    });

    this.events.on("player-died", () => {
      this.time.delayedCall(1000, () => this.scene.restart());
    });
  }

  update(_time: number, delta: number) {
    this.player.update(_time, delta);
    this.healthBar.setHealth(this.player["health"]);

    this.bullets.getChildren().forEach((b) => {
      const bullet = b as Phaser.Physics.Arcade.Sprite;
      if (bullet.active && (
        bullet.y < -20 || bullet.y > 620 ||
        bullet.x < -20 || bullet.x > 820
      )) {
        bullet.setActive(false).setVisible(false);
        bullet.body!.enable = false;
      }
    });
  }

  private fireBullet(targetX: number, targetY: number) {
    const bullet = this.bullets.get(this.player.x, this.player.y) as Phaser.Physics.Arcade.Sprite;
    if (!bullet) return;

    bullet.setActive(true).setVisible(true);
    bullet.body!.enable = true;

    const angle = Phaser.Math.Angle.Between(
      this.player.x, this.player.y, targetX, targetY
    );
    bullet.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);

    this.time.delayedCall(2000, () => {
      bullet.setActive(false).setVisible(false);
      bullet.body!.enable = false;
    });
  }

  private onBulletHitEnemy(bullet: Phaser.Physics.Arcade.Sprite, enemy: Enemy) {
    bullet.setActive(false).setVisible(false);
    bullet.body!.enable = false;
    enemy.takeDamage();

    if (enemy.active === false) {
      this.score += 100;
      this.scoreText.setText(`Điểm: ${this.score}`);
    }
  }

  private onPlayerHitEnemy(_player: Player, _enemy: Enemy) {
    this.player.takeDamage(10);
  }

  private spawnEnemy() {
    const x = Phaser.Math.Between(50, 750);
    const enemy = new Enemy(this, x, 0, this.player);
    this.enemies.add(enemy);
  }
}
