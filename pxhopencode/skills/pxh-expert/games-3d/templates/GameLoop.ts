class Game {
  private player: Player;
  private enemies: Enemy[] = [];
  private shooting: ShootingSystem;
  private clock = new THREE.Clock();

  constructor() {
    this.player = new Player(scene, camera);
    this.shooting = new ShootingSystem(scene, camera);

    for (let i = 0; i < 5; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        0,
        (Math.random() - 0.5) * 40
      );
      this.enemies.push(new Enemy(scene, pos));
    }

    this.animate();
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();

    this.player.update(delta, camera);
    this.shooting.update(delta);

    this.enemies.forEach(e => e.update(delta, this.player.mesh.position));

    renderer.render(scene, camera);
  }
}
