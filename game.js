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
const soundButton = document.getElementById('soundButton');
const secretButton = document.getElementById('secretButton');
const secretUnlock = document.getElementById('secretUnlock');
const secretCodeInput = document.getElementById('secretCodeInput');
const secretMessage = document.getElementById('secretMessage');
const selectedCharacterText = document.getElementById('selectedCharacterText');
const characterButtons = [...document.querySelectorAll('[data-character]')];
const previewCanvases = [...document.querySelectorAll('[data-preview]')];

const WIDTH = 432;
const HEIGHT = 768;
const STORAGE_KEY = 'sky-hopper-best-score';
const STORAGE_KEY_CHARACTER = 'sky-hopper-character';
const STORAGE_KEY_AUDIO = 'sky-hopper-audio-enabled';
const STORAGE_KEY_SECRET_CHARACTER = 'sky-hopper-secret-sixseven-unlocked';
const SECRET_UNLOCK_CODE = 'ilove67';
const groundHeight = 96;

const CHARACTERS = [
  {
    id: 'classic',
    name: 'Classic Yellow',
    body: '#facc15',
    crest: '#fde047',
    wing: '#eab308',
    beak: '#fb923c',
    beakShadow: '#f97316',
    eye: '#f8fafc',
    pupil: '#020617',
    shadow: '#020617',
    trail: '#facc15',
    scoreBurst: '#38bdf8',
  },
  {
    id: 'ruby',
    name: 'Ruby Swift',
    body: '#fb7185',
    crest: '#fecdd3',
    wing: '#e11d48',
    beak: '#fbbf24',
    beakShadow: '#f59e0b',
    eye: '#fff1f2',
    pupil: '#450a0a',
    shadow: '#020617',
    trail: '#fb7185',
    scoreBurst: '#f9a8d4',
  },
  {
    id: 'midnight',
    name: 'Midnight Comet',
    body: '#312e81',
    crest: '#818cf8',
    wing: '#1e1b4b',
    beak: '#22d3ee',
    beakShadow: '#0891b2',
    eye: '#e0f2fe',
    pupil: '#020617',
    shadow: '#020617',
    trail: '#818cf8',
    scoreBurst: '#22d3ee',
  },
  {
    id: 'sixseven',
    name: 'Six Seven',
    locked: true,
    badge: '67',
    body: '#a855f7',
    crest: '#facc15',
    wing: '#22d3ee',
    beak: '#fb7185',
    beakShadow: '#e11d48',
    eye: '#f8fafc',
    pupil: '#111827',
    shadow: '#020617',
    trail: '#c084fc',
    scoreBurst: '#facc15',
  },
];

let bestScore = Number(localStorage.getItem(STORAGE_KEY) || 0);
let selectedCharacterId = localStorage.getItem(STORAGE_KEY_CHARACTER) || CHARACTERS[0].id;
let secretCharacterUnlocked = localStorage.getItem(STORAGE_KEY_SECRET_CHARACTER) === 'true';
let state = 'ready';
let score = 0;
let lastTime = 0;
let spawnTimer = 0;
let animationFrame = 0;
let difficulty = 0;
let groundOffset = 0;
let audioContext = null;
let masterGain = null;
let musicTimer = 0;
let musicStep = 0;
let musicMode = '';
let soundEnabled = localStorage.getItem(STORAGE_KEY_AUDIO) !== 'false';
let backgroundOscillators = [];
let audioUnlockInstalled = false;

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

function isCharacterUnlocked(character) {
  return Boolean(character) && (!character.locked || secretCharacterUnlocked);
}

function getSelectedCharacter() {
  const character = CHARACTERS.find((entry) => entry.id === selectedCharacterId);
  return character && isCharacterUnlocked(character) ? character : CHARACTERS[0];
}

function syncSecretCharacterLockState() {
  characterButtons.forEach((button) => {
    const character = CHARACTERS.find((entry) => entry.id === button.dataset.character);
    const locked = Boolean(character && !isCharacterUnlocked(character));
    button.classList.toggle('locked', locked);
    button.setAttribute('aria-disabled', String(locked));
    button.title = locked ? 'Enter the secret code to unlock this bird.' : '';
  });
}

function unlockSecretCharacter() {
  const enteredCode = secretCodeInput.value.trim().toLowerCase();
  if (enteredCode !== SECRET_UNLOCK_CODE) {
    secretMessage.textContent = 'Wrong code. Try again.';
    secretCodeInput.select();
    playPauseSound();
    return;
  }

  secretCharacterUnlocked = true;
  localStorage.setItem(STORAGE_KEY_SECRET_CHARACTER, 'true');
  secretMessage.textContent = 'Unlocked Six Seven! The 6/7 bird is now playable.';
  secretButton.textContent = 'Unlocked';
  secretButton.setAttribute('aria-expanded', 'true');
  syncSecretCharacterLockState();
  selectCharacter('sixseven');
}

function selectCharacter(characterId, playSound = true) {
  const character = CHARACTERS.find((entry) => entry.id === characterId) || CHARACTERS[0];
  if (!isCharacterUnlocked(character)) {
    secretMessage.textContent = 'That bird is locked. Tap Secret and enter the code.';
    secretUnlock.hidden = false;
    secretButton.setAttribute('aria-expanded', 'true');
    secretCodeInput.focus();
    playPauseSound();
    return;
  }

  selectedCharacterId = character.id;
  localStorage.setItem(STORAGE_KEY_CHARACTER, character.id);
  selectedCharacterText.textContent = character.name;

  characterButtons.forEach((button) => {
    const selected = button.dataset.character === character.id;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });

  drawCharacterPreviews();
  if (playSound) playCharacterSelectSound();
}

function setupAudio(installUnlock = true) {
  if (!soundEnabled) return null;
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.42;
    masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
    if (installUnlock) installAudioUnlock();
  }
  if (masterGain) masterGain.gain.setTargetAtTime(0.42, audioContext.currentTime, 0.015);
  return audioContext;
}

function removeAudioUnlock() {
  if (!audioUnlockInstalled) return;
  audioUnlockInstalled = false;
  document.removeEventListener('pointerdown', unlockAudio, true);
  document.removeEventListener('click', unlockAudio, true);
  window.removeEventListener('keydown', unlockAudio, true);
}

function installAudioUnlock() {
  if (audioUnlockInstalled || !soundEnabled) return;
  audioUnlockInstalled = true;
  document.addEventListener('pointerdown', unlockAudio, true);
  document.addEventListener('click', unlockAudio, true);
  window.addEventListener('keydown', unlockAudio, true);
}

function unlockAudio() {
  removeAudioUnlock();
  if (!soundEnabled) return;
  const audio = setupAudio(false);
  if (audio && audio.state === 'suspended') audio.resume();
  if (state === 'ready' || state === 'gameover') {
    stopBackgroundMusic();
    startStartScreenMusic();
  }
}

function updateSoundButton() {
  soundButton.textContent = soundEnabled ? 'Sound On' : 'Sound Off';
  soundButton.setAttribute('aria-label', soundEnabled ? 'Mute sound' : 'Enable sound');
  soundButton.setAttribute('aria-pressed', String(soundEnabled));
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem(STORAGE_KEY_AUDIO, String(soundEnabled));
  updateSoundButton();

  if (soundEnabled) {
    setupAudio();
    playResumeSound();
    if (state === 'playing') startGameplayMusic();
    else if (state === 'ready' || state === 'gameover') startStartScreenMusic();
  } else {
    removeAudioUnlock();
    stopBackgroundMusic();
    if (masterGain) masterGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.015);
  }
}

function playTone(frequency, duration, type = 'square', volume = 0.18, delay = 0) {
  const audio = setupAudio();
  if (!audio || !masterGain) return null;

  const start = audio.currentTime + delay;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
  return oscillator;
}

function playFlapSound() {
  const tone = playTone(620, 0.08, 'square', 0.14);
  if (tone && audioContext) tone.frequency.exponentialRampToValueAtTime(920, audioContext.currentTime + 0.08);
}

function playScoreSound() {
  playTone(784, 0.08, 'triangle', 0.16);
  playTone(1175, 0.1, 'triangle', 0.14, 0.07);
}

function playCharacterSelectSound() {
  playTone(520, 0.05, 'triangle', 0.1);
  playTone(660, 0.07, 'triangle', 0.09, 0.045);
}

function playPauseSound() {
  playTone(440, 0.08, 'sine', 0.12);
  playTone(330, 0.11, 'sine', 0.1, 0.055);
}

function playResumeSound() {
  playTone(330, 0.07, 'sine', 0.1);
  playTone(495, 0.1, 'sine', 0.12, 0.055);
}

function playGameOverSound() {
  playTone(220, 0.16, 'sawtooth', 0.15);
  playTone(165, 0.22, 'sawtooth', 0.13, 0.12);
}

function startMusicMode(mode, allowedStates, melody, bass, interval) {
  if (!allowedStates.includes(state) || document.hidden || !soundEnabled || !setupAudio()) return;
  if (musicTimer && musicMode === mode) return;
  stopBackgroundMusic();
  musicMode = mode;
  musicStep = 0;

  const playMusicStep = () => {
    if (!allowedStates.includes(state) || document.hidden || !soundEnabled || musicMode !== mode) {
      stopBackgroundMusic();
      return;
    }

    backgroundOscillators = backgroundOscillators.filter((oscillator) => oscillator.context.currentTime < oscillator.stopTime);
    const melodyOscillator = playTone(melody[musicStep % melody.length], 0.16, 'triangle', 0.045);
    const bassOscillator = playTone(bass[musicStep % bass.length], 0.18, 'sine', 0.032);
    if (melodyOscillator) melodyOscillator.stopTime = audioContext.currentTime + 0.18;
    if (bassOscillator) bassOscillator.stopTime = audioContext.currentTime + 0.2;
    backgroundOscillators.push(...[melodyOscillator, bassOscillator].filter(Boolean));
    musicStep += 1;
  };

  playMusicStep();
  musicTimer = window.setInterval(playMusicStep, interval);
}

function startStartScreenMusic() {
  startMusicMode('start-screen', ['ready', 'gameover'], [392, 494, 587, 659, 587, 494], [196, 247, 294, 247, 220, 247], 320);
}

function startGameplayMusic() {
  startMusicMode('gameplay', ['playing'], [262, 330, 392, 523, 392, 330, 294, 349], [131, 131, 196, 196, 147, 147, 175, 175], 230);
}

function startBackgroundMusic() {
  if (state === 'playing') startGameplayMusic();
  else if (state === 'ready' || state === 'gameover') startStartScreenMusic();
}

function stopBackgroundMusic() {
  if (musicTimer) {
    window.clearInterval(musicTimer);
    musicTimer = 0;
  }
  backgroundOscillators.forEach((oscillator) => {
    try {
      oscillator.stop();
    } catch (error) {
      // The oscillator may already have reached its scheduled stop time.
    }
  });
  backgroundOscillators = [];
  musicMode = '';
}

function drawCharacterPreviews() {
  previewCanvases.forEach((previewCanvas) => {
    const previewCtx = previewCanvas.getContext('2d');
    const character = CHARACTERS.find((entry) => entry.id === previewCanvas.dataset.preview) || CHARACTERS[0];
    drawCharacterPreview(previewCtx, character);
  });
}

function drawCharacterPreview(previewCtx, character) {
  previewCtx.clearRect(0, 0, 72, 56);
  previewCtx.save();
  previewCtx.translate(36, 30);
  previewCtx.scale(0.86, 0.86);
  drawBirdSprite(previewCtx, character, 0);
  previewCtx.restore();
}

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
  stopBackgroundMusic();
  state = 'playing';
  setOverlay(false);
  pauseButton.textContent = 'Pause';
  startGameplayMusic();
  flap();
}

function pauseGame(playSound = true) {
  if (state !== 'playing') return;
  state = 'paused';
  stopBackgroundMusic();
  if (playSound) playPauseSound();
  setOverlay(true, 'Paused', 'Catch Your Breath', 'Tap resume when you are ready to dodge more gates.', 'Resume');
  pauseButton.textContent = 'Resume';
}

function resumeGame() {
  if (state !== 'paused') return;
  state = 'playing';
  lastTime = performance.now();
  setOverlay(false);
  pauseButton.textContent = 'Pause';
  playResumeSound();
  startBackgroundMusic();
}

function endGame() {
  if (state === 'gameover') return;
  state = 'gameover';
  stopBackgroundMusic();
  playGameOverSound();
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
  startStartScreenMusic();
  pauseButton.textContent = 'Pause';
  const character = getSelectedCharacter();
  burst(bird.x, bird.y, character.body, 16);
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
  playFlapSound();
  const character = getSelectedCharacter();
  burst(bird.x - 12, bird.y + 18, character.trail, 5);
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
      playScoreSound();
      const character = getSelectedCharacter();
      burst(bird.x, bird.y, character.scoreBurst, 8);
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
  drawBirdSprite(ctx, getSelectedCharacter(), Math.sin(performance.now() / 80) * 5);
  ctx.restore();
}

function drawBirdSprite(targetCtx, character, wingY) {
  targetCtx.fillStyle = character.shadow;
  targetCtx.fillRect(-18, -15, 39, 31);
  targetCtx.fillStyle = character.body;
  targetCtx.fillRect(-20, -18, 36, 30);
  targetCtx.fillStyle = character.crest;
  targetCtx.fillRect(-14, -24, 26, 12);
  targetCtx.fillStyle = character.beak;
  targetCtx.fillRect(10, -5, 22, 10);
  targetCtx.fillStyle = character.beakShadow;
  targetCtx.fillRect(18, 3, 14, 8);
  targetCtx.fillStyle = character.eye;
  targetCtx.fillRect(2, -15, 10, 10);
  targetCtx.fillStyle = character.pupil;
  targetCtx.fillRect(7, -11, 4, 4);
  targetCtx.fillStyle = character.wing;
  targetCtx.fillRect(-20, wingY, 19, 12);
  if (character.badge === '67') {
    targetCtx.fillStyle = '#fef3c7';
    targetCtx.fillRect(-15, -14, 26, 18);
    targetCtx.fillStyle = '#4c1d95';
    targetCtx.font = '900 16px monospace';
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';
    targetCtx.fillText('67', -2, -5);
  }
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
  if (event.target === secretCodeInput) return;
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
soundButton.addEventListener('click', toggleSound);
secretButton.addEventListener('click', () => {
  const expanded = secretUnlock.hidden;
  secretUnlock.hidden = !expanded;
  secretButton.setAttribute('aria-expanded', String(expanded));
  if (expanded) secretCodeInput.focus();
});
secretUnlock.addEventListener('submit', (event) => {
  event.preventDefault();
  unlockSecretCharacter();
});
characterButtons.forEach((button) => {
  button.addEventListener('click', () => selectCharacter(button.dataset.character));
});
document.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button')) return;
  flap();
});
window.addEventListener('keydown', handleKey);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopBackgroundMusic();
    if (state === 'playing') pauseGame(false);
  } else if (state === 'playing') {
    startGameplayMusic();
  } else if (state === 'ready' || state === 'gameover') {
    startStartScreenMusic();
  }
});

updateSoundButton();
syncSecretCharacterLockState();
if (secretCharacterUnlocked) {
  secretButton.textContent = 'Unlocked';
  secretMessage.textContent = 'Six Seven is unlocked and ready to fly.';
}
if (!isCharacterUnlocked(CHARACTERS.find((entry) => entry.id === selectedCharacterId))) {
  selectedCharacterId = CHARACTERS[0].id;
}
selectCharacter(selectedCharacterId, false);
setOverlay(true, 'Ready', 'Flap Through Neon Gates', 'Avoid the towers, collect points, and keep your tiny rocket bird airborne.', 'Start Game');
startStartScreenMusic();
draw();
animationFrame = requestAnimationFrame(loop);

window.addEventListener('pagehide', () => {
  stopBackgroundMusic();
  cancelAnimationFrame(animationFrame);
});
