class LODSystem {
  private entries: { mesh: THREE.Mesh; distance: number }[][] = [];
  private camera: THREE.Camera;

  constructor(camera: THREE.Camera) {
    this.camera = camera;
  }

  add(meshes: { mesh: THREE.Mesh; distance: number }[]) {
    this.entries.push(meshes.sort((a, b) => a.distance - b.distance));
  }

  update() {
    for (const levels of this.entries) {
      const dist = this.camera.position.distanceTo(levels[0].mesh.position);
      let shown = false;

      for (const level of levels) {
        if (dist <= level.distance && !shown) {
          level.mesh.visible = true;
          shown = true;
        } else {
          level.mesh.visible = false;
        }
      }

      if (!shown) {
        levels[levels.length - 1].mesh.visible = true;
      }
    }
  }
}
