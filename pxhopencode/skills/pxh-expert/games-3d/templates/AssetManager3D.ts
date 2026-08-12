class AssetManager3D {
  private loader = new GLTFLoader();
  private textureLoader = new THREE.TextureLoader();
  private cache = new Map<string, any>();

  async loadModel(key: string, url: string, fallback: () => THREE.Group): Promise<THREE.Group> {
    if (this.cache.has(key)) return this.cache.get(key)!.clone();

    try {
      const gltf = await new Promise<GLTF>((resolve, reject) => {
        this.loader.load(url, resolve, undefined, reject);
      });
      const group = gltf.scene.clone();
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.cache.set(key, group);
      return group;
    } catch {
      console.warn(`Failed to load ${url}, using fallback`);
      const fallbackGroup = fallback();
      this.cache.set(key, fallbackGroup);
      return fallbackGroup.clone();
    }
  }
}

function createFallbackPlayer(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5, 1, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x2196F3 })
  );
  body.position.y = 1;
  body.castShadow = true;
  g.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xFFCC80 })
  );
  head.position.y = 1.8;
  head.castShadow = true;
  g.add(head);
  return g;
}
