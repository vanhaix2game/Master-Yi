const cameraBounds = {
  minX: -TILE_WIDTH * mapWidth / 2,
  maxX: TILE_WIDTH * mapWidth / 2,
  minY: -TILE_HEIGHT * mapHeight / 2,
  maxY: TILE_HEIGHT * mapHeight + TILE_HEIGHT * mapHeight / 2,
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;

function edgeScroll(camera: Phaser.Cameras.Scene2D.Camera, speed = 5) {
  const margin = 30;
  const mx = this.input.x;
  const my = this.input.y;

  if (mx < margin) camera.scrollX -= speed;
  else if (mx > window.innerWidth - margin) camera.scrollX += speed;
  if (my < margin) camera.scrollY -= speed;
  else if (my > window.innerHeight - margin) camera.scrollY += speed;
}
