function getClickedTile(pointer: Phaser.Input.Pointer) {
  const worldX = pointer.x;
  const worldY = pointer.y;

  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;
  const cx = worldX - this.cameras.main.width / 2;
  const cy = worldY;

  const tileX = Math.floor((cx / halfW + cy / halfH) / 2);
  const tileY = Math.floor((cy / halfH - cx / halfW) / 2);

  return { x: tileX, y: tileY };
}
