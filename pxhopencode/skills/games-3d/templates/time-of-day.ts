interface TimeOfDay {
  sunColor: THREE.Color;
  ambientColor: THREE.Color;
  fogColor: THREE.Color;
  shadowIntensity: number;
}

const TIMES = {
  dawn: {
    sunColor: new THREE.Color(0xFF6B35),
    ambientColor: new THREE.Color(0x404060),
    fogColor: new THREE.Color(0xCC8844),
    shadowIntensity: 0.8,
  },
  noon: {
    sunColor: new THREE.Color(0xFFFFFF),
    ambientColor: new THREE.Color(0x406040),
    fogColor: new THREE.Color(0x87CEEB),
    shadowIntensity: 1.0,
  },
  dusk: {
    sunColor: new THREE.Color(0xFF4444),
    ambientColor: new THREE.Color(0x402040),
    fogColor: new THREE.Color(0x884466),
    shadowIntensity: 0.7,
  },
  night: {
    sunColor: new THREE.Color(0x112244),
    ambientColor: new THREE.Color(0x101020),
    fogColor: new THREE.Color(0x000011),
    shadowIntensity: 0.3,
  },
};
