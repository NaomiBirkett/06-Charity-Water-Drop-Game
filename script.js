// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let score = 0;
let timer = 30;
let timerInterval;

// High score logic
let highScore = 0;
function loadHighScore() {
  const stored = localStorage.getItem('cw_high_score');
  highScore = stored ? parseInt(stored, 10) : 0;
  const hsElem = document.getElementById("high-score");
  if (hsElem) hsElem.textContent = highScore;
}
function saveHighScore(newScore) {
  if (newScore > highScore) {
    highScore = newScore;
    localStorage.setItem('cw_high_score', highScore);
    const hsElem = document.getElementById("high-score");
    if (hsElem) hsElem.textContent = highScore;
  }
}

// Difficulty settings for drop interval and fall speed
const DIFFICULTY_SETTINGS = {
  easy:   { dropInterval: 1300, dropFallDuration: 6.5, canFallDuration: 8 },
  medium: { dropInterval: 1000, dropFallDuration: 4,   canFallDuration: 5.5 },
  hard:   { dropInterval: 700,  dropFallDuration: 2.2, canFallDuration: 3 }
};

let currentDifficulty = 'medium';

// Water drop sound effect
let dropSound = null;
let dropSoundReady = false;
function prepareDropSound() {
  if (!dropSound) {
    dropSound = new Audio("water-drip-45622.mp3");
    dropSound.preload = "auto";
    dropSound.load();
    dropSoundReady = true;
  }
}
function playDropSound() {
  if (dropSoundReady && dropSound) {
    try {
      // Clone node to allow overlapping sounds
      dropSound.cloneNode().play();
    } catch (e) {}
  }
}

function updateWaterLevel() {
  const fill = document.getElementById("water-fill");
  const fillPercent = Math.min(score / 50, 1); // Cap at 100%
  console.log("Updating fill height to", fillPercent * 100 + "%");
  fill.style.height = `${fillPercent * 100}%`;

  if (fillPercent === 1) {
    console.log("You hydrated the whole community!");
    // Optional: trigger confetti, sound, or a fun message here
  }
}

// Wait for button click to start the game
document.addEventListener("DOMContentLoaded", function() {
  loadHighScore();
  document.getElementById("start-btn").addEventListener("click", function() {
    startGame();
  });
  document.getElementById("restart-btn").addEventListener("click", function() {
    // Hide the high score screen, but do not start the game
    const highScoreScreen = document.getElementById("end-game-screen");
    highScoreScreen.classList.add("d-none");
    highScoreScreen.style.display = "none";
    // Optionally reset score and timer display
    document.getElementById("score").textContent = 0;
    document.getElementById("time").textContent = 30;
    document.getElementById("water-fill").style.height = "0%";
    // Do NOT call startGame here
  });
  const resetBtn = document.getElementById("reset-high-score-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", function() {
      localStorage.removeItem('cw_high_score');
      highScore = 0;
      const hsElem = document.getElementById("high-score");
      if (hsElem) hsElem.textContent = highScore;
    });
  }

  // Add restart game button logic
  const restartGameBtn = document.getElementById("restart-game-btn");
  if (restartGameBtn) {
    restartGameBtn.addEventListener("click", function() {
      // End current game if running, then start a new one
      if (gameRunning) {
        endGame(true); // Mark as lost, but you could also just reset
      }
      startGame();
    });
  }
  // Difficulty menu logic
  const difficultySelect = document.getElementById("difficulty-select");
  if (difficultySelect) {
    currentDifficulty = difficultySelect.value;
    difficultySelect.addEventListener("change", function() {
      currentDifficulty = difficultySelect.value;
    });
  }

  // Prepare sound on first user interaction
  document.body.addEventListener("pointerdown", prepareDropSound, { once: true });
  document.getElementById("start-btn").addEventListener("click", prepareDropSound, { once: true });
  document.getElementById("restart-btn").addEventListener("click", prepareDropSound, { once: true });
});

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  gameRunning = true;
  score = 0;
  timer = 30;
  document.getElementById("score").textContent = score;
  document.getElementById("time").textContent = timer;
  const highScoreScreen = document.getElementById("end-game-screen");
  highScoreScreen.classList.add("d-none");
  highScoreScreen.style.display = "none";
  document.getElementById("game-container").style.pointerEvents = "auto";

  // Clear any previous intervals to avoid multiple timers
  if (timerInterval) clearInterval(timerInterval);
  if (dropMaker) clearInterval(dropMaker);

  // Get current difficulty settings
  const settings = DIFFICULTY_SETTINGS[currentDifficulty] || DIFFICULTY_SETTINGS.medium;

  // Start timer
  timerInterval = setInterval(() => {
    timer--;
    document.getElementById("time").textContent = timer;
    if (timer <= 0) {
      endGame();
    }
  }, 1000);

  // Create new drops at the interval for the selected difficulty
  dropMaker = setInterval(() => createDrop(settings), settings.dropInterval);
}

function createDrop(settings = DIFFICULTY_SETTINGS.medium) {
  // 1 in 6 chance to create a water can, 1 in 8 chance to create a bad drop
  const rand = Math.random();
  let drop;
  let isWaterCan = false;
  let isBadDrop = false;
  if (rand < 1/6) {
    isWaterCan = true;
    drop = document.createElement("img");
    drop.src = "img/water-can-transparent.png";
    drop.className = "water-can";
    drop.alt = "Water Can";
  } else if (rand < 1/6 + 1/8) {
    isBadDrop = true;
    drop = document.createElement("div");
    drop.className = "water-drop bad-drop";
  } else {
    drop = document.createElement("div");
    drop.className = "water-drop";
  }

  // Make drops/cans different sizes for visual variety
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = `${size}px`;
  drop.style.height = `${size}px`;
  if (size < 50) {
    drop.style.minWidth = '50px';
    drop.style.minHeight = '50px';
    drop.style.display = 'flex';
    drop.style.alignItems = 'center';
    drop.style.justifyContent = 'center';
  }

  // Position randomly across the game width
  const gameWidth = document.getElementById("game-container").offsetWidth;
  const dropWidth = parseFloat(drop.style.width);
  const xPosition = Math.random() * (gameWidth - dropWidth);
  drop.style.left = xPosition + "px";
  drop.style.position = "absolute";
  drop.style.animation = "dropFall linear forwards";
  drop.style.animationDuration = (settings.dropFallDuration || 4) + "s";
  drop.style.transformOrigin = "center";

  document.getElementById("game-container").appendChild(drop);

  drop.addEventListener("animationend", () => {
    drop.remove();
  });

  if (isWaterCan) {
    // Create a circular div as a clickable area, place the can image inside
    const canWrapper = document.createElement('div');
    canWrapper.style.width = `${size < 50 ? 50 : size}px`;
    canWrapper.style.height = `${size < 50 ? 50 : size}px`;
    canWrapper.style.borderRadius = '50%';
    canWrapper.style.position = 'absolute';
    canWrapper.style.left = xPosition + 'px';
    canWrapper.style.top = '0px';
    canWrapper.style.display = 'flex';
    canWrapper.style.alignItems = 'center';
    canWrapper.style.justifyContent = 'center';
    canWrapper.style.cursor = 'pointer';
    canWrapper.style.zIndex = 1000;
    canWrapper.style.pointerEvents = 'auto';
    canWrapper.style.background = 'rgba(255,255,255,0.01)';
    canWrapper.style.animation = 'dropFall linear forwards';
    canWrapper.style.animationDuration = (settings.canFallDuration || 5.5) + "s";
    canWrapper.style.transformOrigin = 'center';

    // Center the can image and remove its animation
    drop.style.pointerEvents = 'auto';
    drop.style.display = 'block';
    drop.style.margin = 'auto';
    drop.style.animation = 'none';
    drop.style.position = 'static';
    drop.style.maxWidth = '80%';
    drop.style.maxHeight = '80%';

    canWrapper.appendChild(drop);
    document.getElementById("game-container").appendChild(canWrapper);
    canWrapper.addEventListener("animationend", () => {
      canWrapper.remove();
    });
    function handleCanClick(e) {
      if (!gameRunning) return;
      playDropSound();
      score += 5;
      updateWaterLevel();
      document.getElementById("score").textContent = score;
      canWrapper.remove();
      canWrapper.removeEventListener("click", handleCanClick);
      drop.removeEventListener("click", handleCanClick);
    }
    canWrapper.addEventListener("click", handleCanClick);
    drop.addEventListener("click", handleCanClick);
    return;
  } else if (isBadDrop) {
    drop.addEventListener("click", function handleBadDropClick(e) {
      if (!gameRunning) return;
      playDropSound();
      score -= 5;
      updateWaterLevel();
      document.getElementById("score").textContent = score;
      drop.remove();
      drop.removeEventListener("click", handleBadDropClick);
      if (score < 0) {
        endGame(true); // pass true to indicate loss
      }
    });
  } else {
    drop.addEventListener("click", function handleDropClick(e) {
      if (!gameRunning) return;
      playDropSound();
      score++;
      updateWaterLevel();
      document.getElementById("score").textContent = score;
      drop.remove();
      drop.removeEventListener("click", handleDropClick);
    });
  }
}

function showConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  const confettiCount = 120;
  const confetti = [];
  const colors = ['#FFC907', '#2E9DF7', '#8BD1CB', '#FF902A', '#F5402C', '#4FCB53'];
  for (let i = 0; i < confettiCount; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * confettiCount,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngle: 0,
      tiltAngleIncremental: (Math.random() * 0.07) + 0.05
    });
  }
  let angle = 0;
  let frame = 0;
  function drawConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    angle += 0.01;
    for (let i = 0; i < confettiCount; i++) {
      let c = confetti[i];
      c.tiltAngle += c.tiltAngleIncremental;
      c.y += (Math.cos(angle + c.d) + 3 + c.r / 2) / 2;
      c.x += Math.sin(angle);
      c.tilt = Math.sin(c.tiltAngle) * 15;
      ctx.beginPath();
      ctx.lineWidth = c.r;
      ctx.strokeStyle = c.color;
      ctx.moveTo(c.x + c.tilt + c.r / 3, c.y);
      ctx.lineTo(c.x + c.tilt, c.y + c.tilt + 10);
      ctx.stroke();
    }
    frame++;
    if (frame < 120) {
      requestAnimationFrame(drawConfetti);
    } else {
      canvas.style.display = 'none';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  drawConfetti();
}

function endGame(lost = false) {
  gameRunning = false;
  clearInterval(dropMaker);
  clearInterval(timerInterval);
  document.getElementById("game-container").style.pointerEvents = "none";
  document.querySelectorAll('.water-drop, .water-can').forEach(d => d.remove());
  document.getElementById("final-score").textContent = score;
  saveHighScore(score);
  const highScoreScreen = document.getElementById("end-game-screen");
  highScoreScreen.classList.remove("d-none");
  highScoreScreen.style.display = "flex";
  if (lost) {
    highScoreScreen.querySelector("h2").textContent = "You lose!";
  } else {
    highScoreScreen.querySelector("h2").textContent = "Time's Up!";
    showConfetti();
  }
}

document.body.addEventListener("click", (e) => {
  showSplash(e.clientX, e.clientY);
  score += 1;
  updateWaterLevel();
});
