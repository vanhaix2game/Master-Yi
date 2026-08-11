const AUDIO_FORMATS = [
  { ext: "mp3", mime: "audio/mpeg" },
  { ext: "ogg", mime: "audio/ogg" },
  { ext: "wav", mime: "audio/wav" },
  { ext: "aac", mime: "audio/aac" },
];

function getSupportedFormat(): { ext: string; mime: string } | null {
  const audio = document.createElement("audio");
  for (const fmt of AUDIO_FORMATS) {
    if (audio.canPlayType(fmt.mime) !== "") return fmt;
  }
  return null;
}

function audioUrl(basePath: string): string {
  const fmt = getSupportedFormat();
  return fmt ? `${basePath}.${fmt.ext}` : `${basePath}.mp3`;
}
