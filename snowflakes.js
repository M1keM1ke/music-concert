// Общий снегопад для страниц концерта.
// Подключение из папки трека:
//   <link rel="stylesheet" href="../snowflakes.css">
//   <script src="../snowflakes.js"></script>
//   const snow = createSnowfall();
//   snow.start(); // новые снежинки начинают падать сверху
//   snow.stop();  // новые больше не появляются, уже видимые долетают вниз

function createSnowfall() {
  const layer = document.createElement("div");
  layer.className = "snowfall";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);

  let timer = null;

  function spawn(delay) {
    const crystal = Math.random() < 0.4;
    const flake = crystal ? crystalFlake() : document.createElement("span");
    flake.classList.add("snowfall__flake");
    if (!crystal) {
      flake.classList.add("snowfall__flake--dot");
    }

    const size = crystal ? 14 + Math.random() * 16 : 4 + Math.random() * 5;
    flake.style.setProperty("--x", Math.random() * 100 + "%");
    flake.style.setProperty("--size", size + "px");
    flake.style.setProperty("--opacity", (0.45 + Math.random() * 0.5).toFixed(2));
    flake.style.setProperty("--duration", (9 + Math.random() * 7).toFixed(2) + "s");
    flake.style.setProperty("--drift", (Math.random() * 70 - 35).toFixed(1) + "px");
    flake.style.setProperty("--spin", (Math.random() * 240 - 120).toFixed(0) + "deg");
    flake.style.setProperty("--delay", delay + "s");
    flake.addEventListener("animationend", () => flake.remove());
    layer.appendChild(flake);
  }

  function start() {
    if (timer) {
      return;
    }
    for (let index = 0; index < 10; index += 1) {
      spawn(index * 0.12);
    }
    timer = window.setInterval(() => spawn(0), 280);
  }

  function stop() {
    window.clearInterval(timer);
    timer = null;
  }

  return { start, stop };
}

function crystalFlake() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  svg.setAttribute("viewBox", "0 0 24 24");
  path.setAttribute(
    "d",
    "M12 1.5v21M1.5 12h21M4.8 4.8l14.4 14.4M19.2 4.8 4.8 19.2M12 5.2l-2.2 2.2M12 5.2l2.2 2.2M12 18.8l-2.2-2.2M12 18.8l2.2-2.2"
  );
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "white");
  path.setAttribute("stroke-width", "1.15");
  path.setAttribute("stroke-linecap", "round");
  svg.appendChild(path);
  return svg;
}
