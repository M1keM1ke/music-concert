const audio = document.getElementById("track");
const button = document.getElementById("toggle");

function setPlaying(isOn) {
  button.setAttribute("aria-pressed", String(isOn));
  button.setAttribute("aria-label", isOn ? "Пауза" : "Слушать");
}

button.addEventListener("click", async () => {
  if (!audio.paused) {
    audio.pause();
    return;
  }
  try {
    await audio.play();
  } catch (error) {
    setPlaying(false);
  }
});

audio.addEventListener("play", () => setPlaying(true));
audio.addEventListener("pause", () => setPlaying(false));
audio.addEventListener("ended", () => {
  audio.currentTime = 0;
  setPlaying(false);
});
