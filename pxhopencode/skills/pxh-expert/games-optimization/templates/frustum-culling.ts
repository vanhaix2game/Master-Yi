class FrustumCuller {
  private frustum = new THREE.Frustum();
  private projScreenMatrix = new THREE.Matrix4();

  update(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera) {
    this.projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
  }

  isVisible(boundingSphere: { center: THREE.Vector3; radius: number }): boolean {
    return this.frustum.intersectsSphere(boundingSphere);
  }
}
