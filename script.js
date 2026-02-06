const noBtn = document.getElementById("no-btn");
const yesBtn = document.getElementById("yes-btn");
const buttonsArea = document.getElementById("buttons-area");
const message = document.getElementById("message");
const hearts = document.getElementById("hearts");

const TOTAL_ESCAPES = 15;
const ESCAPE_TRIGGER_DISTANCE = 180;
const MIN_ESCAPE_DISTANCE = 140;
let escapesLeft = TOTAL_ESCAPES;
let yesScale = 1;
let currentPosition = { x: 0, y: 0 };
let lastEscapeTime = 0;
let hasEscaped = false;

function getViewportBounds() {
  const btnRect = noBtn.getBoundingClientRect();
  const padding = 10;
  const maxX = Math.max(0, window.innerWidth - btnRect.width - padding * 2);
  const maxY = Math.max(0, window.innerHeight - btnRect.height - padding * 2);

  return { btnRect, padding, maxX, maxY };
}

function clampPosition(x, y) {
  const { padding, maxX, maxY } = getViewportBounds();
  const clampedX = Math.min(maxX + padding, Math.max(padding, x));
  const clampedY = Math.min(maxY + padding, Math.max(padding, y));

  return { x: clampedX, y: clampedY };
}

function applyNoPosition(position) {
  currentPosition = clampPosition(position.x, position.y);
  noBtn.style.transform = `translate(${currentPosition.x}px, ${currentPosition.y}px)`;
}

function handleFinalYes() {
  noBtn.style.display = "none";
  yesBtn.style.setProperty("--yes-scale", "1.75");
  yesBtn.classList.add("super-yes", "bounce");
  buttonsArea.style.justifyContent = "center";
}

function nudgeAwayFromPointer(pointerX, pointerY) {
  if (escapesLeft <= 0) {
    return;
  }

  const now = Date.now();
  if (now - lastEscapeTime < 260) {
    return;
  }
  lastEscapeTime = now;

  const { btnRect, padding, maxX, maxY } = getViewportBounds();
  const noRect = noBtn.getBoundingClientRect();
  const yesRect = yesBtn.getBoundingClientRect();
  const noCenterX = noRect.left + noRect.width / 2;
  const noCenterY = noRect.top + noRect.height / 2;
  const yesCenterX = yesRect.left + yesRect.width / 2;
  const yesCenterY = yesRect.top + yesRect.height / 2;
  const distanceToNo = Math.hypot(pointerX - noCenterX, pointerY - noCenterY);
  const distanceToYes = Math.hypot(pointerX - yesCenterX, pointerY - yesCenterY);

  if (distanceToNo > ESCAPE_TRIGGER_DISTANCE || distanceToNo >= distanceToYes) {
    return;
  }

  if (!hasEscaped) {
    currentPosition = clampPosition(noRect.left, noRect.top);
    noBtn.style.position = "fixed";
    noBtn.style.left = "0";
    noBtn.style.top = "0";
    applyNoPosition(currentPosition);
    hasEscaped = true;
  }

  const centerX = currentPosition.x + btnRect.width / 2;
  const centerY = currentPosition.y + btnRect.height / 2;
  const dx = centerX - pointerX;
  const dy = centerY - pointerY;
  const distance = Math.hypot(dx, dy);
  const safeDx = distance === 0 ? 1 : dx / distance;
  const safeDy = distance === 0 ? -1 : dy / distance;
  const step = 160 + Math.min(120, ESCAPE_TRIGGER_DISTANCE - distance);

  let nextX = currentPosition.x + safeDx * step + (Math.random() - 0.5) * 70;
  let nextY = currentPosition.y + safeDy * step + (Math.random() - 0.5) * 70;

  let nextPosition = clampPosition(nextX, nextY);
  let movedDistance = Math.hypot(
    nextPosition.x - currentPosition.x,
    nextPosition.y - currentPosition.y,
  );

  if (movedDistance < MIN_ESCAPE_DISTANCE) {
    for (let i = 0; i < 8; i += 1) {
      const randomX = padding + Math.random() * maxX;
      const randomY = padding + Math.random() * maxY;
      const candidate = clampPosition(randomX, randomY);
      movedDistance = Math.hypot(
        candidate.x - currentPosition.x,
        candidate.y - currentPosition.y,
      );
      if (movedDistance >= MIN_ESCAPE_DISTANCE) {
        nextPosition = candidate;
        break;
      }
    }
  }

  applyNoPosition(nextPosition);

  escapesLeft -= 1;

  // Slightly grow the "Yes" button each time "No" escapes
  yesScale = Math.min(1.75, yesScale + 0.12);
  yesBtn.style.setProperty("--yes-scale", yesScale.toFixed(2));

  if (escapesLeft === 0) {
    window.setTimeout(handleFinalYes, 260);
  }
}

// Cursor proximity makes the "No" button flee
window.addEventListener("mousemove", (event) => {
  nudgeAwayFromPointer(event.clientX, event.clientY);
});

window.addEventListener("touchstart", (event) => {
  const touch = event.touches[0];
  if (touch) {
    nudgeAwayFromPointer(touch.clientX, touch.clientY);
  }
});

window.addEventListener("touchmove", (event) => {
  const touch = event.touches[0];
  if (touch) {
    nudgeAwayFromPointer(touch.clientX, touch.clientY);
  }
});

// Prevent the "No" button from ever being clickable
noBtn.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  event.stopPropagation();
  nudgeAwayFromPointer(event.clientX, event.clientY);
});
noBtn.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  nudgeAwayFromPointer(event.clientX, event.clientY);
});

// Celebrate the "Yes"
yesBtn.addEventListener("click", () => {
  message.hidden = false;
  spawnHearts();
});

// Create a small burst of hearts
function spawnHearts() {
  hearts.innerHTML = "";

  for (let i = 0; i < 10; i += 1) {
    const heart = document.createElement("span");
    heart.className = "heart";
    heart.textContent = "💖";
    heart.style.left = `${Math.random() * 80 + 10}%`;
    heart.style.top = `${Math.random() * 60 + 20}%`;
    heart.style.animationDelay = `${i * 0.08}s`;
    hearts.appendChild(heart);
  }
}
