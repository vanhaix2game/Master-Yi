class FirstPersonController {
  private pitch = 0;
  private yaw = 0;
  private speed = 8;
  private sensitivity = 0.002;
  private isLocked = false;
  private keys = new Set<string>();

  constructor(
    private camera: THREE.PerspectiveCamera,
    private domElement: HTMLElement
  ) {
    this.domElement.addEventListener("click", () => {
      this.domElement.requestPointerLock();
    });

    document.addEventListener("pointerlockchange", () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });

    document.addEventListener("mousemove", (e) => {
      if (!this.isLocked) return;
      this.yaw -= e.movementX * this.sensitivity;
      this.pitch -= e.movementY * this.sensitivity;
      this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
    });

    document.addEventListener("keydown", (e) => { this.keys.add(e.code); });
    document.addEventListener("keyup", (e) => { this.keys.delete(e.code); });
  }

  update(delta: number) {
    const qx = new THREE.Quaternion();
    const qy = new THREE.Quaternion();
    qx.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);
    qy.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    this.camera.quaternion.copy(qx.multiply(qy));

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    right.y = 0;
    right.normalize();

    const velocity = new THREE.Vector3();
    if (this.keys.has("KeyW")) velocity.add(forward);
    if (this.keys.has("KeyS")) velocity.sub(forward);
    if (this.keys.has("KeyA")) velocity.sub(right);
    if (this.keys.has("KeyD")) velocity.add(right);
    velocity.normalize().multiplyScalar(this.speed * delta);

    this.camera.position.add(velocity);
  }
}
