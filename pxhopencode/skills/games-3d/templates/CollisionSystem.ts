class CollisionSystem {
  private raycaster = new THREE.Raycaster();
  private meshes: THREE.Mesh[] = [];

  addMesh(mesh: THREE.Mesh) {
    this.meshes.push(mesh);
  }

  raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDist: number = 1000): THREE.Intersection | null {
    this.raycaster.set(origin, direction.normalize());
    this.raycaster.far = maxDist;
    const intersects = this.raycaster.intersectObjects(this.meshes);
    return intersects[0] || null;
  }

  checkSphereCollision(position: THREE.Vector3, radius: number): THREE.Intersection | null {
    for (const mesh of this.meshes) {
      const dist = position.distanceTo(mesh.position);
      const meshRadius = (mesh.geometry.boundingSphere?.radius ?? 1) * Math.max(
        mesh.scale.x, mesh.scale.y, mesh.scale.z
      );
      if (dist < radius + meshRadius) {
        return { object: mesh, distance: dist, point: position, face: null! };
      }
    }
    return null;
  }
}
