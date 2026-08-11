function createTerrain(width: number, depth: number, heightData: number[][]) {
  const geometry = new THREE.PlaneGeometry(width, depth, heightData[0].length - 1, heightData.length - 1);
  const vertices = geometry.attributes.position.array;

  for (let z = 0; z < heightData.length; z++) {
    for (let x = 0; x < heightData[0].length; x++) {
      const idx = (z * heightData[0].length + x) * 3;
      vertices[idx + 2] = heightData[z][x];
    }
  }

  geometry.computeVertexNormals();
  return geometry;
}
