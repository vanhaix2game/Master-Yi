class ShootingSystem {
  private bullets: THREE.Mesh[] = [];
  private fireRate = 0.1;
  private lastFire = 0;
  private bulletGeometry: THREE.BufferGeometry;
  private bulletMaterial: THREE.Material;

  constructor(private scene: THREE.Scene, private camera: THREE.PerspectiveCamera) {
    this.bulletGeometry = new THREE.SphereGeometry(0.05, 4, 4);
    this.bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    window.addEventListener("mousedown", () => this.fire());
  }

  fire() {
    const now = performance.now() / 1000;
    if (now - this.lastFire < this.fireRate) return;
    this.lastFire = now;

    const bullet = new THREE.Mesh(this.bulletGeometry, this.bulletMaterial);
    bullet.position.copy(this.camera.position);

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);
    bullet.userData.velocity = direction.multiplyScalar(50);

    this.scene.add(bullet);
    this.bullets.push(bullet);
  }

  update(delta: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.position.add(bullet.userData.velocity.clone().multiplyScalar(delta));

      if (bullet.position.length() > 100) {
        this.scene.remove(bullet);
        this.bullets.splice(i, 1);
      }
    }
  }
}
