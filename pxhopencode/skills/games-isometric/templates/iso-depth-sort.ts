function sortByDepth(objects: Phaser.GameObjects.GameObject[]) {
  objects.sort((a, b) => {
    const ax = a.getData("tileX") + a.getData("tileY");
    const bx = b.getData("tileX") + b.getData("tileY");
    return ax - bx;
  });
  objects.forEach((obj, i) => obj.setDepth(i + 500));
}

function moveIsoEntity(
  scene: Phaser.Scene,
  entity: Phaser.GameObjects.GameObject,
  fromX: number, fromY: number,
  toX: number, toY: number,
  duration = 150
) {
  const fromIso = cartToIso(fromX, fromY, 1);
  const toIso = cartToIso(toX, toY, 1);

  return new Promise<void>((resolve) => {
    scene.tweens.add({
      targets: entity,
      x: { from: fromIso.x, to: toIso.x },
      y: { from: fromIso.y - TILE_HEIGHT_3D, to: toIso.y - TILE_HEIGHT_3D },
      duration,
      ease: "Power2",
      onComplete: () => resolve(),
    });
  });
}
