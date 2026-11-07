const body = document.body;
const audio = document.getElementById("track");
const button = document.getElementById("toggle");
const label = document.getElementById("label");
const bar = document.getElementById("bar");
const thumb = document.getElementById("thumb");
const progress = document.getElementById("progress");
const time = document.getElementById("time");
const sourceUrl = audio.dataset.src;

const playLabel = "Зажечь ёлку";
const pauseLabel = "Погасить";

let pending = false;
let dragging = false;
let seekSerial = 0;
let mediaReady = null;

function formatTime(value) {
  if (!Number.isFinite(value)) {
    return "0:00";
  }
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return minutes + ":" + String(seconds).padStart(2, "0");
}

function paint(ratio) {
  const percent = Math.min(100, Math.max(0, ratio * 100));
  bar.style.width = percent + "%";
  thumb.style.left = percent + "%";
  progress.setAttribute("aria-valuenow", String(Math.round(percent)));
  if (Number.isFinite(audio.duration)) {
    time.textContent = formatTime(ratio * audio.duration) + " / " + formatTime(audio.duration);
  }
}

function renderTime() {
  if (dragging || !Number.isFinite(audio.duration) || audio.duration === 0) {
    return;
  }
  paint(audio.currentTime / audio.duration);
}

function loadMedia() {
  if (!mediaReady) {
    mediaReady = fetch(sourceUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("status " + response.status);
        }
        return response.blob();
      })
      .then((blob) => {
        audio.src = URL.createObjectURL(blob);
      })
      .catch(() => {
        audio.src = sourceUrl;
      })
      .then(() => waitForMetadata());
  }
  return mediaReady;
}

function waitForMetadata() {
  if (audio.readyState >= 1 && Number.isFinite(audio.duration)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const done = () => {
      cleanup();
      resolve();
    };
    const fail = () => {
      cleanup();
      reject(new Error("audio"));
    };
    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", done);
      audio.removeEventListener("error", fail);
    };
    audio.addEventListener("loadedmetadata", done);
    audio.addEventListener("error", fail);
  });
}

function ratioFromEvent(event) {
  const rect = progress.getBoundingClientRect();
  if (!rect.width) {
    return 0;
  }
  return (event.clientX - rect.left) / rect.width;
}

function commitSeek(ratio) {
  const serial = ++seekSerial;
  const clamped = Math.min(1, Math.max(0, ratio));
  paint(clamped);
  loadMedia()
    .then(() => {
      if (serial !== seekSerial || !Number.isFinite(audio.duration)) {
        return;
      }
      audio.currentTime = clamped * audio.duration;
    })
    .catch(() => {});
}

function startPlayback() {
  if (audio.ended) {
    audio.currentTime = 0;
  }
  return audio.play();
}

function setPlaying(isOn) {
  body.classList.toggle("is-playing", isOn);
  button.setAttribute("aria-pressed", String(isOn));
  label.textContent = isOn ? pauseLabel : playLabel;
}

function spawnSnow() {
  const layer = document.querySelector(".snow");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const total = reduced ? 12 : 34;

  for (let index = 0; index < total; index += 1) {
    const crystal = index % 5 === 0;
    const flake = crystal ? crystalFlake() : document.createElement("span");
    flake.classList.add("flake");
    if (crystal) {
      flake.classList.add("crystal");
    }

    const size = crystal ? 10 + Math.random() * 16 : 2 + Math.random() * 4.5;
    flake.style.left = Math.random() * 100 + "%";
    flake.style.width = size + "px";
    flake.style.height = size + "px";
    flake.style.opacity = (0.35 + Math.random() * 0.6).toFixed(2);
    flake.style.setProperty("--drift", (Math.random() * 48 - 24).toFixed(1) + "px");

    if (reduced) {
      flake.style.top = Math.random() * 100 + "%";
      flake.style.animation = "none";
    } else {
      const duration = 9 + Math.random() * 13;
      flake.style.animationDuration = duration + "s";
      flake.style.animationDelay = (-Math.random() * duration) + "s";
    }

    layer.appendChild(flake);
  }
}

function crystalFlake() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  path.setAttribute("d", "M12 1.5v21M1.5 12h21M4.8 4.8l14.4 14.4M19.2 4.8 4.8 19.2M12 5.2l-2.2 2.2M12 5.2l2.2 2.2M12 18.8l-2.2-2.2M12 18.8l2.2-2.2");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "white");
  path.setAttribute("stroke-width", "1.15");
  path.setAttribute("stroke-linecap", "round");
  svg.appendChild(path);
  return svg;
}

button.addEventListener("click", () => {
  if (pending) {
    return;
  }
  if (!audio.paused) {
    audio.pause();
    return;
  }
  if (audio.readyState >= 1 && audio.src) {
    startPlayback().catch(() => {
      label.textContent = "Нажмите ещё раз";
    });
    return;
  }

  pending = true;
  label.textContent = "Зажигаем…";
  loadMedia()
    .then(() => startPlayback())
    .catch(() => {
      label.textContent = "Нажмите ещё раз";
    })
    .finally(() => {
      pending = false;
    });
});

audio.addEventListener("play", () => setPlaying(true));
audio.addEventListener("pause", () => setPlaying(false));
audio.addEventListener("ended", () => {
  setPlaying(false);
  if (!dragging) {
    paint(1);
  }
});
audio.addEventListener("timeupdate", renderTime);
audio.addEventListener("loadedmetadata", renderTime);

progress.addEventListener("pointerdown", (event) => {
  dragging = true;
  progress.setPointerCapture(event.pointerId);
  commitSeek(ratioFromEvent(event));
});

progress.addEventListener("pointermove", (event) => {
  if (!dragging) {
    return;
  }
  commitSeek(ratioFromEvent(event));
});

function stopDrag(event) {
  if (!dragging) {
    return;
  }
  dragging = false;
  if (progress.hasPointerCapture(event.pointerId)) {
    progress.releasePointerCapture(event.pointerId);
  }
}

progress.addEventListener("pointerup", stopDrag);
progress.addEventListener("pointercancel", stopDrag);

progress.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
    return;
  }
  event.preventDefault();
  loadMedia()
    .then(() => {
      if (!audio.duration) {
        return;
      }
      const delta = event.key === "ArrowRight" ? 5 : -5;
      audio.currentTime = Math.min(audio.duration, Math.max(0, audio.currentTime + delta));
      renderTime();
    })
    .catch(() => {});
});

loadMedia().then(renderTime).catch(() => {});
spawnSnow();
