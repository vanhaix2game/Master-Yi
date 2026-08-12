import * as THREE from "three";

class InstancedMeshes {
  private instances: Map<string, THREE.InstancedMesh> = new Map();
  private tempMatrix = new THREE.Matrix4();
  private tempColor = new THREE.Color();

  create(name: string, geometry: THREE.BufferGeometry, material: THREE.Material, count: number) {
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instances.set(name, mesh);
    return mesh;
  }

  setTransform(name: string, index: number, position: THREE.Vector3, rotation?: THREE.Euler, scale?: THREE.Vector3) {
    const mesh = this.instances.get(name);
    if (!mesh) return;

    this.tempMatrix.identity();
    if (position) this.tempMatrix.setPosition(position);
    if (rotation) this.tempMatrix.makeRotationFromEuler(rotation);
    if (scale) this.tempMatrix.scale(scale);
    mesh.setMatrixAt(index, this.tempMatrix);
  }

  setColor(name: string, index: number, color: THREE.Color) {
    const mesh = this.instances.get(name);
    if (mesh && mesh.instanceColor) {
      mesh.setColorAt(index, color);
    }
  }

  update(name: string) {
    const mesh = this.instances.get(name);
    if (mesh) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }
}
