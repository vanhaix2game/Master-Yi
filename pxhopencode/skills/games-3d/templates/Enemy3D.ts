class Enemy {
  mesh: THREE.Group;
  private fsm = new FSM();
  private health = 3;
  private speed = 3;
  private detectionRange = 20;

  constructor(scene: THREE.Scene, position: THREE.Vector3, assetMgr: AssetManager3D) {
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    scene.add(this.mesh);

    assetMgr.loadModel("enemy", "assets/enemy.glb", () => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.4, 0.8, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      );
      body.position.y = 0.6;
      body.castShadow = true;
      g.add(body);
      return g;
    }).then((model) => this.mesh.add(model));
  }

  update(delta: number, playerPos: THREE.Vector3) {
    this.fsm.update(delta);
    if (this.fsm.state === "die") return;

    const dist = this.mesh.position.distanceTo(playerPos);

    if (dist < this.detectionRange && this.fsm.state !== "chase") {
      this.fsm.transition("chase");
    } else if (dist >= this.detectionRange && this.fsm.state !== "patrol") {
      this.fsm.transition("idle");
    }

    if (this.fsm.state === "chase") {
      const dir = new THREE.Vector3().copy(playerPos).sub(this.mesh.position).normalize();
      this.mesh.position.add(dir.multiplyScalar(this.speed * delta));
      this.mesh.lookAt(playerPos);
    }
  }

  takeDamage(): boolean {
    if (this.fsm.state === "die") return false;
    this.health--;
    this.fsm.transition("hurt");
    if (this.health <= 0) {
      this.fsm.transition("die");
      setTimeout(() => {
        this.mesh.parent?.remove(this.mesh);
      }, 600);
      return true;
    }
    return false;
  }
}
