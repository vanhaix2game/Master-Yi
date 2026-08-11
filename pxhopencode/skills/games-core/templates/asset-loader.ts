class AssetLoader {
  private cache = new Map<string, any>();
  private loading = new Map<string, Promise<any>>();
  private maxRetries = 2;

  async load<T>(url: string): Promise<T> {
    if (this.cache.has(url)) return this.cache.get(url) as T;

    if (this.loading.has(url)) {
      return this.loading.get(url) as Promise<T>;
    }

    const promise = this.loadWithRetry<T>(url);
    this.loading.set(url, promise);

    try {
      const asset = await promise;
      this.cache.set(url, asset);
      return asset;
    } finally {
      this.loading.delete(url);
    }
  }

  private async loadWithRetry<T>(url: string, attempt = 0): Promise<T> {
    try {
      const ext = url.split(".").pop()?.toLowerCase();
      switch (ext) {
        case "png": case "jpg": case "webp": return this.loadImage(url) as T;
        case "mp3": case "wav": case "ogg": return this.loadAudio(url) as T;
        case "json": return this.loadJSON(url) as T;
        case "glb": return this.loadGLTF(url) as T;
        default: throw new Error(`Unknown asset type: ${ext}`);
      }
    } catch (err) {
      if (attempt < this.maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        return this.loadWithRetry<T>(url, attempt + 1);
      }
      throw err;
    }
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  private loadAudio(url: string): Promise<AudioBuffer> {
    return fetch(url)
      .then(r => r.arrayBuffer())
      .then(buf => new AudioContext().decodeAudioData(buf));
  }

  private async loadJSON(url: string): Promise<any> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.json();
  }

  private loadGLTF(url: string): Promise<any> {
    // THREE.GLTFLoader
    return import("three/examples/jsm/loaders/GLTFLoader.js").then(m => {
      const loader = new m.GLTFLoader();
      return new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
    });
  }

  preload(urls: string[], onProgress?: (pct: number) => void) {
    let done = 0;
    return Promise.all(urls.map(url =>
      this.load(url).then(() => {
        done++;
        onProgress?.(done / urls.length);
      })
    ));
  }
}
