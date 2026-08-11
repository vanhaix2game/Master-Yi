function worldToScreen(wx: number, wy: number): { x: number; y: number } {
  return {
    x: (wx - wy) * TILE_WIDTH / 2,
    y: (wx + wy) * TILE_HEIGHT / 2,
  };
}

function screenToWorld(sx: number, sy: number): { x: number; y: number } {
  return {
    x: (sx / (TILE_WIDTH / 2) + sy / (TILE_HEIGHT / 2)) / 2,
    y: (sy / (TILE_HEIGHT / 2) - sx / (TILE_WIDTH / 2)) / 2,
  };
}
