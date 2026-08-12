export class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const bar = this.add.rectangle(width / 2, height / 2, 0, 20, 0x00ff00);

    this.load.on("progress", (value: number) => {
      bar.width = width * 0.6 * value;
    });

    const ASSETS = [
      { key: "player",     path: "assets/player.png",          fallback: this.generateSprite("#2196F3") },
      { key: "enemy",      path: "assets/enemy.png",           fallback: this.generateSprite("#FF0000") },
      { key: "bullet",     path: "assets/bullet.png",          fallback: this.generateSprite("#FFFF00", 8) },
      { key: "tiles",      path: "assets/tiles.png",           fallback: null },
      { key: "player_sheet", path: "assets/player_sheet.png",  fallback: null },
    ];

    for (const asset of ASSETS) {
      if (asset.fallback) {
        this.textures.addCanvas(asset.key, asset.fallback);
      }
      try {
        this.load.image(asset.key, asset.path);
      } catch { /* fallback đã có */ }
    }

    this.load.spritesheet("player_sheet", "assets/player_sheet.png", {
      frameWidth: 32, frameHeight: 32,
    });

    this.load.on("complete", () => {
      if (!this.anims.exists("player_idle")) {
        this.anims.create({ key: "player_idle",  frames: [{ key: "player_sheet", frame: 0 }], frameRate: 4, repeat: -1 });
        this.anims.create({ key: "player_run",   frames: this.anims.generateFrameNumbers("player_sheet", { start: 4, end: 9 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: "player_jump",  frames: this.anims.generateFrameNumbers("player_sheet", { start: 10, end: 12 }), frameRate: 8, repeat: 0 });
        this.anims.create({ key: "player_attack",frames: this.anims.generateFrameNumbers("player_sheet", { start: 13, end: 17 }), frameRate: 12, repeat: 0 });
        this.anims.create({ key: "player_hurt",  frames: this.anims.generateFrameNumbers("player_sheet", { start: 18, end: 19 }), frameRate: 4, repeat: 0 });
        this.anims.create({ key: "player_die",   frames: this.anims.generateFrameNumbers("player_sheet", { start: 20, end: 23 }), frameRate: 6, repeat: 0 });
      }
    });

    this.load.audio("shoot", "assets/shoot.mp3");
    this.load.audio("bgm", "assets/bgm.mp3");
  }

  create() {
    this.scene.start("MenuScene");
  }

  private generateSprite(color: string, size = 32): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#fff";
    ctx.font = `${size * 0.5}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", size / 2, size / 2);
    return canvas;
  }
}
