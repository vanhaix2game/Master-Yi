export class MenuScene extends Phaser.Scene {
  constructor() { super("MenuScene"); }

  create() {
    const { width, height } = this.cameras.main;

    this.add.text(width / 2, height / 3, "TÊN GAME", {
      fontSize: "48px",
      color: "#ffffff",
    }).setOrigin(0.5);

    const playBtn = this.add.text(width / 2, height / 2, "▶ CHƠI", {
      fontSize: "32px",
      color: "#00ff00",
    }).setOrigin(0.5).setInteractive();

    playBtn.on("pointerover", () => playBtn.setColor("#ffff00"));
    playBtn.on("pointerout", () => playBtn.setColor("#00ff00"));
    playBtn.on("pointerdown", () => this.scene.start("GameScene"));
  }
}
