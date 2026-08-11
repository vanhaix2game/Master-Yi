function drawStackedTile(x: number, y: number, height: number, color: number) {
  for (let z = 0; z < height; z++) {
    const pos = cartToIso(x, y, z);
    drawTileAt(pos.x, pos.y, darkenColor(color, z * 0.1));
  }
}

function darkenColor(color: number, amount: number): number {
  const r = Math.floor(((color >> 16) & 0xFF) * (1 - amount));
  const g = Math.floor(((color >> 8) & 0xFF) * (1 - amount));
  const b = Math.floor((color & 0xFF) * (1 - amount));
  return (r << 16) | (g << 8) | b;
}

function drawTree(x: number, y: number) {
  drawStackedTile(x, y, 3, 0x8B4513);
  const top = cartToIso(x, y, 3);
  drawTileAt(top.x, top.y, 0x228B22);
}
