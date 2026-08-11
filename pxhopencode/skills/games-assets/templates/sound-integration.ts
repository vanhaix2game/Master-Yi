// BootScene / init
const audio = new SoundManager();

// Load SFX — tự fallback procedural nếu file không tồn tại
const SFX_LIST = ["shoot", "explosion", "jump", "collect", "hurt", "die", "hit"];
for (const key of SFX_LIST) {
  audio.loadSFX(key, `assets/audio/${key}.mp3`);
}
audio.loadBGM("assets/audio/bgm.mp3");

// Play events — auto fallback nếu asset chưa download
function onShoot() { audio.playSFX("shoot"); }
function onJump() { audio.playSFX("jump"); }
function onHurt() { audio.playSFX("hurt"); }
function onDeath() { audio.playSFX("die"); }
function onCollect() { audio.playSFX("collect"); }

audio.playBGM(); // Start background music
