const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreText = document.getElementById('scoreText');
const bestText = document.getElementById('bestText');
const overlay = document.getElementById('overlay');
const stateLabel = document.getElementById('stateLabel');
const stateTitle = document.getElementById('stateTitle');
const stateCopy = document.getElementById('stateCopy');
const primaryButton = document.getElementById('primaryButton');
const flapButton = document.getElementById('flapButton');
const pauseButton = document.getElementById('pauseButton');

const WIDTH = 432;
const HEIGHT = 768;
const STORAGE_KEY = 'sky-hopper-best-score';
const groundHeight = 96;

let bestScore = Number(localStorage.getItem(STORAGE_KEY) || 0);
let state = 'ready';
let score = 0;
let lastTime = 0;
let spawnTimer = 0;
let animationFrame = 0;
let difficulty = 0;
let groundOffset = 0;

const bird = {
  x: 112,
  y: 310,
  size: 32,
  velocity: 0,
  rotation: 0,
};

let pipes = [];
let particles = [];

bestText.textContent = bestScore;

function resetGame() {
  score = 0;
  difficulty = 0;
  spawnTimer = 0;
  groundOffset = 0;
  pipes = [];
  particles = [];
  bird.y = 310;
  bird.velocity = 0;
  bird.rotation = 0;
  updateScore();
}

function updateScore() {
  scoreText.textContent = score;
  bestText.textContent = bestScore;
}

function setOverlay(visible, label = '', title = '', copy = '', button = '') {
  overlay.classList.toggle('visible', visible);
  if (!visible) return;
  stateLabel.textContent = label;
  stateTitle.textContent = title;
  stateCopy.textContent = copy;
  primaryButton.textContent = button;
}

function startGame() {
  resetGame();
  state = 'playing';
  setOverlay(false);
  pauseButton.textContent = 'Pause';
  flap();
}

function pauseGame() {
  if (state !== 'playing') return;
  state = 'paused';
  setOverlay(true, 'Paused', 'Catch Your Breath', 'Tap resume when you are ready to dodge more gates.', 'Resume');
  pauseButton.textContent = 'Resume';
}

function resumeGame() {
  if (state !== 'paused') return;
  state = 'playing';
  lastTime = performance.now();
  setOverlay(false);
  pauseButton.textContent = 'Pause';
}

function endGame() {
  if (state === 'gameover') return;
  state = 'gameover';
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem(STORAGE_KEY, String(bestScore));
  }
  updateScore();
  setOverlay(
    true,
    'Game Over',
    score > 0 ? `${score} Gate${score === 1 ? '' : 's'} Cleared` : 'Try Again',
    `Best score: ${bestScore}. Time each flap and slip through the moving skyline.`,
    'Restart'
  );
  pauseButton.textContent = 'Pause';
  burst(bird.x, bird.y, '#fb7185', 16);
}

function flap() {
  if (state === 'ready' || state === 'gameover') {
    startGame();
    return;
  }
  if (state === 'paused') {
    resumeGame();
    return;
  }
  bird.velocity = -435;
  burst(bird.x - 12, bird.y + 18, '#facc15', 5);
}

function togglePause() {
  if (state === 'playing') pauseGame();
  else if (state === 'paused') resumeGame();
}

function spawnPipe() {
  const gap = Math.max(150, 214 - difficulty * 4);
  const topMin = 92;
  const topMax = HEIGHT - groundHeight - gap - 112;
  const top = topMin + Math.random() * Math.max(1, topMax - topMin);
  pipes.push({
    x: WIDTH + 28,
    width: 72,
    top,
    bottom: top + gap,
    passed: false,
  });
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 170,
      vy: (Math.random() - 0.5) * 170,
      life: 0.45 + Math.random() * 0.25,
      color,
    });
  }
}

function update(dt) {
  if (state !== 'playing') return;

  difficulty = Math.min(16, score * 0.55);
  const speed = 178 + difficulty * 9;
  const gravity = 1170 + difficulty * 10;
  const spawnEvery = Math.max(1.05, 1.56 - difficulty * 0.025);

  bird.velocity += gravity * dt;
  bird.y += bird.velocity * dt;
  bird.rotation = Math.max(-0.55, Math.min(1.1, bird.velocity / 620));
  groundOffset = (groundOffset + speed * dt) % 48;
  spawnTimer += dt;

  if (spawnTimer >= spawnEvery) {
    spawnTimer = 0;
    spawnPipe();
  }

  pipes.forEach((pipe) => {
    pipe.x -= speed * dt;
    if (!pipe.passed && pipe.x + pipe.width < bird.x - bird.size / 2) {
      pipe.passed = true;
      score += 1;
      updateScore();
      burst(bird.x, bird.y, '#38bdf8', 8);
    }
  });
  pipes = pipes.filter((pipe) => pipe.x + pipe.width > -20);

  particles.forEach((particle) => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 360 * dt;
    particle.life -= dt;
  });
  particles = particles.filter((particle) => particle.life > 0);

  if (bird.y - bird.size / 2 <= 0 || bird.y + bird.size / 2 >= HEIGHT - groundHeight || hitPipe()) {
    endGame();
  }
}

function hitPipe() {
  const radius = bird.size * 0.42;
  return pipes.some((pipe) => {
    const inX = bird.x + radius > pipe.x && bird.x - radius < pipe.x + pipe.width;
    const inGap = bird.y - radius > pipe.top && bird.y + radius < pipe.bottom;
    return inX && !inGap;
  });
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#38bdf8');
  sky.addColorStop(0.52, '#60a5fa');
  sky.addColorStop(1, '#1e3a8a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  for (let i = 0; i < 7; i += 1) {
    const x = ((i * 92 - groundOffset * 0.3) % (WIDTH + 90)) - 60;
    const y = 72 + (i % 3) * 82;
    pixelCloud(x, y, 2 + (i % 2));
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  for (let x = -80; x < WIDTH + 80; x += 80) {
    const towerX = x - groundOffset * 0.45;
    const h = 86 + ((x + 240) % 130);
    ctx.fillRect(towerX, HEIGHT - groundHeight - h, 56, h);
    ctx.fillRect(towerX + 12, HEIGHT - groundHeight - h - 24, 32, 24);
  }
}

function pixelCloud(x, y, scale) {
  const block = 8 * scale;
  ctx.fillRect(x, y + block, block * 5, block * 2);
  ctx.fillRect(x + block, y, block * 3, block);
  ctx.fillRect(x + block * 4, y + block * 1.5, block * 2, block);
}

function drawPipes() {
  pipes.forEach((pipe) => {
    drawPipe(pipe.x, 0, pipe.width, pipe.top, true);
    drawPipe(pipe.x, pipe.bottom, pipe.width, HEIGHT - groundHeight - pipe.bottom, false);
  });
}

function drawPipe(x, y, width, height, topPipe) {
  ctx.fillStyle = '#14532d';
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(x + 6, y, width - 18, height);
  ctx.fillStyle = '#86efac';
  ctx.fillRect(x + 12, y + 8, 10, Math.max(0, height - 16));
  ctx.fillStyle = '#052e16';
  ctx.fillRect(x + width - 12, y, 12, height);

  const lipH = 26;
  const lipY = topPipe ? y + height - lipH : y;
  ctx.fillStyle = '#052e16';
  ctx.fillRect(x - 8, lipY, width + 16, lipH);
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(x - 2, lipY + 5, width + 4, 12);
}

function drawGround() {
  ctx.fillStyle = '#713f12';
  ctx.fillRect(0, HEIGHT - groundHeight, WIDTH, groundHeight);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, HEIGHT - groundHeight, WIDTH, 14);
  ctx.fillStyle = '#84cc16';
  ctx.fillRect(0, HEIGHT - groundHeight + 14, WIDTH, 12);

  for (let x = -48; x < WIDTH + 48; x += 48) {
    ctx.fillStyle = '#a16207';
    ctx.fillRect(x - groundOffset, HEIGHT - 52, 24, 12);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x + 24 - groundOffset, HEIGHT - 32, 24, 10);
  }
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  ctx.fillStyle = '#020617';
  ctx.fillRect(-18, -15, 39, 31);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-20, -18, 36, 30);
  ctx.fillStyle = '#fde047';
  ctx.fillRect(-14, -24, 26, 12);
  ctx.fillStyle = '#fb923c';
  ctx.fillRect(10, -5, 22, 10);
  ctx.fillStyle = '#f97316';
  ctx.fillRect(18, 3, 14, 8);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(2, -15, 10, 10);
  ctx.fillStyle = '#020617';
  ctx.fillRect(7, -11, 4, 4);
  ctx.fillStyle = '#eab308';
  const wingY = Math.sin(performance.now() / 80) * 5;
  ctx.fillRect(-20, wingY, 19, 12);

  ctx.restore();
}

function drawParticles() {
  particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, particle.life * 2);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, 5, 5);
  });
  ctx.globalAlpha = 1;
}

function drawHud() {
  ctx.fillStyle = 'rgba(2, 6, 23, 0.42)';
  ctx.fillRect(16, 16, 112, 44);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 28px monospace';
  ctx.fillText(String(score), 30, 48);
}

function draw() {
  drawBackground();
  drawPipes();
  drawGround();
  drawParticles();
  drawBird();
  drawHud();
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
  lastTime = now;
  update(dt);
  draw();
  animationFrame = requestAnimationFrame(loop);
}

function handleKey(event) {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    event.preventDefault();
    flap();
  }
  if (event.code === 'KeyP') {
    event.preventDefault();
    togglePause();
  }
}

primaryButton.addEventListener('click', () => {
  if (state === 'paused') resumeGame();
  else startGame();
});
flapButton.addEventListener('click', flap);
pauseButton.addEventListener('click', togglePause);
document.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button')) return;
  flap();
});
window.addEventListener('keydown', handleKey);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'playing') pauseGame();
});

setOverlay(true, 'Ready', 'Flap Through Neon Gates', 'Avoid the towers, collect points, and keep your tiny rocket bird airborne.', 'Start Game');
draw();
animationFrame = requestAnimationFrame(loop);

window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame));
