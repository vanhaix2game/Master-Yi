export class IsoGameScene extends Phaser.Scene {
  private tiles: Phaser.GameObjects.Graphics;
  private entities: Phaser.GameObjects.Sprite[] = [];
  private tileMap: number[][] = [];
  private tileTextures: HTMLImageElement[] = [];

  constructor() { super("IsoGameScene"); }

  preload() {
    try {
      this.load.image("tile_grass", "assets/tiles_grass.png");
      this.load.image("tile_wall", "assets/tiles_wall.png");
      this.load.image("tile_water", "assets/tiles_water.png");
    } catch {
    }
  }

  create() {
    this.generateMap(10, 10);
    this.drawMap();
    this.placePlayer(5, 5);

    this.events.on("postupdate", () => this.sortDepth());
  }

  private generateMap(cols: number, rows: number) {
    this.tileMap = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => {
        const r = Math.random();
        return r > 0.2 ? 0 : (r > 0.1 ? 1 : 2);
      })
    );
  }

  private drawMap() {
    const tileColors = [0x4CAF50, 0x795548, 0x2196F3];
    for (let y = 0; y < this.tileMap.length; y++) {
      for (let x = 0; x < this.tileMap[y].length; x++) {
        const pos = this.cartToIso(x, y);
        const color = tileColors[this.tileMap[y][x]] ?? 0x4CAF50;

        const tile = this.add.graphics();
        tile.fillStyle(color, 1);
        tile.beginPath();
        tile.moveTo(pos.x, pos.y);
        tile.lineTo(pos.x + TILE_WIDTH / 2, pos.y - TILE_HEIGHT / 2);
        tile.lineTo(pos.x + TILE_WIDTH, pos.y);
        tile.lineTo(pos.x + TILE_WIDTH / 2, pos.y + TILE_HEIGHT / 2);
        tile.closePath();
        tile.fillPath();
        tile.lineStyle(1, 0x333333, 0.5);
        tile.strokePath();
        tile.setData("tileX", x);
        tile.setData("tileY", y);
        tile.setDepth(x + y);
      }
    }
  }

  private sortDepth() {
    this.entities.sort((a, b) => {
      const ax = a.getData("tileX") + a.getData("tileY");
      const bx = b.getData("tileX") + b.getData("tileY");
      return ax - bx;
    });
    this.entities.forEach((e, i) => e.setDepth(i + 1000));
  }

  private cartToIso(x: number, y: number, z: number = 0) {
    return {
      x: (x - y) * TILE_WIDTH / 2 + this.cameras.main.width / 2,
      y: (x + y) * TILE_HEIGHT / 2 - z * TILE_HEIGHT_3D,
    };
  }

  private isoToCart(sx: number, sy: number) {
    const cx = sx - this.cameras.main.width / 2;
    const cy = sy;
    return {
      x: Math.floor((cx / (TILE_WIDTH / 2) + cy / (TILE_HEIGHT / 2)) / 2),
      y: Math.floor((cy / (TILE_HEIGHT / 2) - cx / (TILE_WIDTH / 2)) / 2),
    };
  }

  private placePlayer(tileX: number, tileY: number) {
    const pos = this.cartToIso(tileX, tileY, 1);
    const player = this.add.circle(pos.x, pos.y - TILE_HEIGHT_3D, 12, 0x2196F3);
    player.setData("tileX", tileX);
    player.setData("tileY", tileY);
    this.entities.push(player as any);
  }

  update(_time: number, _delta: number) {
    const cursors = this.input.keyboard!.createCursorKeys();
    const player = this.entities[0] as Phaser.GameObjects.Arc;
    if (!player || !player.active) return;
    let dx = 0, dy = 0;

    if (Phaser.Input.Keyboard.JustDown(cursors.left)) { dx = -1; dy = 1; }
    else if (Phaser.Input.Keyboard.JustDown(cursors.right)) { dx = 1; dy = -1; }
    else if (Phaser.Input.Keyboard.JustDown(cursors.up)) { dx = -1; dy = -1; }
    else if (Phaser.Input.Keyboard.JustDown(cursors.down)) { dx = 1; dy = 1; }

    if (dx !== 0) this.movePlayerTo(player, dx, dy);
  }

  private movePlayerTo(player: Phaser.GameObjects.Arc, dx: number, dy: number) {
    const newX = player.getData("tileX") + dx;
    const newY = player.getData("tileY") + dy;

    if (newY < 0 || newY >= this.tileMap.length ||
        newX < 0 || newX >= this.tileMap[0].length) return;

    if (this.tileMap[newY][newX] === 1) return;

    const target = this.cartToIso(newX, newY, 1);
    this.tweens.add({
      targets: player,
      x: target.x,
      y: target.y - TILE_HEIGHT_3D,
      duration: 200,
      ease: "Power2",
    });

    player.setData("tileX", newX);
    player.setData("tileY", newY);
  }
}
