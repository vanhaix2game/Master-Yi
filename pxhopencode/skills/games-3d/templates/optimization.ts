export class BulletPool {
  private pool: THREE.Mesh[] = [];
  private scene: THREE.Scene;
  private geometry: THREE.BufferGeometry;
  private material: THREE.Material;

  constructor(scene: THREE.Scene, geometry?: THREE.BufferGeometry, material?: THREE.Material) {
    this.scene = scene;
    this.geometry = geometry || new THREE.SphereGeometry(0.05, 4, 4);
    this.material = material || new THREE.MeshBasicMaterial({ color: 0xffff00 });
  }

  acquire(): THREE.Mesh {
    const bullet = this.pool.pop() || new THREE.Mesh(this.geometry, this.material);
    bullet.visible = true;
    this.scene.add(bullet);
    return bullet;
  }

  release(bullet: THREE.Mesh) {
    this.scene.remove(bullet);
    bullet.visible = false;
    this.pool.push(bullet);
  }

  releaseAll() {
    for (const child of this.scene.children) {
      if (child instanceof THREE.Mesh && child.material === this.material) {
        this.release(child);
      }
    }
  }

  get size() { return this.pool.length; }
}

export class LODManager {
  private levels: { mesh: THREE.Object3D; distance: number }[] = [];
  private currentLevel = -1;

  addLevel(mesh: THREE.Object3D, distance: number) {
    this.levels.push({ mesh, distance });
    mesh.visible = false;
  }

  update(cameraPosition: THREE.Vector3, targetPosition: THREE.Vector3) {
    const dist = cameraPosition.distanceTo(targetPosition);
    let newLevel = this.levels.length - 1;
    for (let i = 0; i < this.levels.length; i++) {
      if (dist < this.levels[i].distance) { newLevel = i - 1; break; }
    }
    newLevel = Math.max(0, newLevel);
    if (newLevel === this.currentLevel) return;
    if (this.currentLevel >= 0) this.levels[this.currentLevel].mesh.visible = false;
    this.currentLevel = newLevel;
    this.levels[this.currentLevel].mesh.visible = true;
  }

  get activeMesh() {
    return this.currentLevel >= 0 ? this.levels[this.currentLevel].mesh : null;
  }
}

export class GeometryBatcher {
  private geometries: THREE.BufferGeometry[] = [];
  private material: THREE.Material;

  constructor(material: THREE.Material) {
    this.material = material;
  }

  add(geometry: THREE.BufferGeometry) {
    this.geometries.push(geometry);
  }

  merge(): THREE.Mesh | null {
    if (this.geometries.length === 0) return null;
    if (!THREE.BufferGeometryUtils) {
      console.warn("BufferGeometryUtils not available, skipping merge");
      return null;
    }
    const merged = THREE.BufferGeometryUtils.mergeGeometries(this.geometries);
    const mesh = new THREE.Mesh(merged, this.material);
    this.geometries = [];
    return mesh;
  }

  clear() { this.geometries = []; }
}
