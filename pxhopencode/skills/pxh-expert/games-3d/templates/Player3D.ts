class Player {
  mesh: THREE.Group;
  private fsm = new FSM();
  private anim!: AnimationController3D;
  private speed = 10;
  private direction = new THREE.Vector3();
  private keys = { w: false, a: false, s: false, d: false, space: false };
  private health = 100;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, assetMgr: AssetManager3D) {
    this.mesh = new THREE.Group();
    this.mesh.position.set(0, 0, 0);
    scene.add(this.mesh);

    assetMgr.loadModel("player", "assets/player.glb", createFallbackPlayer).then((model) => {
      this.mesh.add(model);
      model.traverse((child) => {
        if (child instanceof THREE.SkinnedMesh) {
        }
      });
    });

    window.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "KeyW": this.keys.w = true; break;
        case "KeyA": this.keys.a = true; break;
        case "KeyS": this.keys.s = true; break;
        case "KeyD": this.keys.d = true; break;
        case "Space": this.keys.space = true; break;
      }
    });
    window.addEventListener("keyup", (e) => {
      switch (e.code) {
        case "KeyW": this.keys.w = false; break;
        case "KeyA": this.keys.a = false; break;
        case "KeyS": this.keys.s = false; break;
        case "KeyD": this.keys.d = false; break;
        case "Space": this.keys.space = false; break;
      }
    });
  }

  update(delta: number, camera: THREE.PerspectiveCamera) {
    this.fsm.update(delta);

    if (this.fsm.state === "idle" || this.fsm.state === "run") {
      this.direction.set(0, 0, 0);
      if (this.keys.w) this.direction.z -= 1;
      if (this.keys.s) this.direction.z += 1;
      if (this.keys.a) this.direction.x -= 1;
      if (this.keys.d) this.direction.x += 1;
      this.direction.normalize();

      const moving = this.direction.length() > 0;
      this.fsm.transition(moving ? "run" : "idle");

      if (moving) {
        this.mesh.position.x += this.direction.x * this.speed * delta;
        this.mesh.position.z += this.direction.z * this.speed * delta;
        this.mesh.lookAt(
          this.mesh.position.x + this.direction.x,
          this.mesh.position.y,
          this.mesh.position.z + this.direction.z
        );
      }
    }

    if (this.keys.space && (this.fsm.state === "idle" || this.fsm.state === "run")) {
      this.fsm.transition("attack");
    }

    this.anim?.update(delta);
    this.anim?.play(this.fsm.state);

    const cameraOffset = new THREE.Vector3(-5, 5, 5);
    const targetPos = this.mesh.position.clone().add(cameraOffset);
    camera.position.lerp(targetPos, 0.1);
    camera.lookAt(this.mesh.position);
  }

  takeDamage(amount: number) {
    if (this.fsm.state === "die" || this.fsm.state === "hurt") return;
    this.health -= amount;
    this.fsm.transition("hurt");
    if (this.health <= 0) this.fsm.transition("die");
  }
}
