async function loadJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error("fetch failed");
    return await res.json();
  } catch { return null; }
}

async function loadMemory() {
  const el = document.getElementById("memory-list");
  const data = await loadJSON("/.memory/index.json")
    || await loadJSON("../.memory/index.json")
    || await loadJSON("../../.memory/index.json");
  if (data) {
    el.innerHTML = `<div class="mem-item"><span class="mem-name">index</span><span class="mem-meta">${data.memory_count ?? 0} entries · conf ${data.confidence ?? "?"}%</span></div>`;
  } else {
    el.innerHTML = '<p class="dim">No memory. Start a session first.</p>';
  }
}

async function loadPipeline() {
  const el = document.getElementById("pipeline-list");
  const data = await loadJSON("/.pipeline-state.json")
    || await loadJSON("../.pipeline-state.json")
    || await loadJSON("../../.pipeline-state.json");
  if (data) {
    el.innerHTML = data.map(s =>
      `<div class="mem-item"><span class="mem-name">${s.phase}</span><span class="mem-meta">→ ${s.agent ?? "?"} · ${s.status ?? "pending"}</span></div>`
    ).join("");
  } else {
    el.innerHTML = '<p class="dim">No active pipeline.</p>';
  }
}

async function loadVersion() {
  const data = await loadJSON("/package.json")
    || await loadJSON("../package.json")
    || await loadJSON("../../package.json");
  if (data) document.getElementById("version").textContent = `v${data.version}`;
}

loadMemory();
loadPipeline();
loadVersion();
