function screenShake(scene: Phaser.Scene, intensity = 5, duration = 100) {
  scene.cameras.main.shake(duration, intensity / 1000);
}
