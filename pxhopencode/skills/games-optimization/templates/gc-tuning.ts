// 1. Tránh tạo object trong game loop
const _vec3 = new THREE.Vector3(); // reuse
const _mat4 = new THREE.Matrix4(); // reuse

function update() {
  _vec3.set(x, y, z); // Không new
  _mat4.identity();
}

// 2. Array pool cho particle
class ArrayPool {
  private arrays: number[][] = [];

  acquire(size: number): number[] {
    for (let i = 0; i < this.arrays.length; i++) {
      if (this.arrays[i].length >= size) {
        const arr = this.arrays.splice(i, 1)[0];
        arr.length = 0;
        return arr;
      }
    }
    return new Array(size);
  }

  release(arr: number[]) {
    arr.length = 0;
    this.arrays.push(arr);
  }
}

// 3. Batch các DOM operation
function batchDOM(updates: (() => void)[]) {
  requestAnimationFrame(() => {
    updates.forEach(fn => fn());
  });
}
