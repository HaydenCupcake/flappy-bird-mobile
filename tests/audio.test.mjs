import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const html = readFileSync(join(root, 'index.html'), 'utf8');
const js = readFileSync(join(root, 'game.js'), 'utf8');

assert.match(html, /id="soundButton"/, 'sound toggle button should exist');
assert.match(html, /aria-label="Mute sound"/, 'sound button should expose its default-on purpose');

assert.match(js, /STORAGE_KEY_AUDIO = 'sky-hopper-audio-enabled'/, 'audio preference localStorage key should exist');
assert.match(js, /localStorage\.getItem\(STORAGE_KEY_AUDIO\) !== 'false'/, 'audio should default on unless persisted off');
assert.match(js, /localStorage\.setItem\(STORAGE_KEY_AUDIO, String\(soundEnabled\)\)/, 'audio preference should persist');
assert.match(js, /selectCharacter\(selectedCharacterId, false\)/, 'initial character render should not autoplay audio');
assert.match(js, /startIntroMusic\(\);\ndraw\(\);/, 'intro music should be attempted after the ready overlay is shown');
assert.match(js, /window\.AudioContext \|\| window\.webkitAudioContext/, 'Web Audio API setup should support browser prefixes');
assert.match(js, /createOscillator\(/, 'generated audio should use oscillators');
assert.match(js, /createGain\(/, 'generated audio should use gain nodes');

[
  'setupAudio',
  'toggleSound',
  'startMusicMode',
  'startStartScreenMusic',
  'startGameplayMusic',
  'startBackgroundMusic',
  'stopBackgroundMusic',
  'installAudioUnlock',
  'unlockAudio',
  'playFlapSound',
  'playScoreSound',
  'playCharacterSelectSound',
  'playPauseSound',
  'playResumeSound',
  'playGameOverSound',
  'playSecretUnlockSound',
  'playSecretFailureSound',
  'startIntroMusic',
].forEach((name) => {
  assert.match(js, new RegExp(`function ${name}\\(`), `${name} should be defined`);
});

assert.match(js, /startBackgroundMusic\(\)/, 'music should be started by gameplay flow');
assert.match(js, /stopBackgroundMusic\(\)/, 'music should be stopped by pause, game over, or visibility flow');
assert.match(js, /musicMode = ''/, 'music mode should track the active background loop');
assert.match(js, /document\.addEventListener\('pointerdown', unlockAudio, true\)/, 'pointerdown should unlock autoplay-blocked audio before gameplay handlers');
assert.match(js, /document\.addEventListener\('click', unlockAudio, true\)/, 'click should unlock autoplay-blocked audio');
assert.match(js, /window\.addEventListener\('keydown', unlockAudio, true\)/, 'keydown should unlock autoplay-blocked audio before gameplay handlers');
assert.match(js, /if \(audioContext\.state === 'suspended'\) \{[\s\S]*installAudioUnlock\(\)/, 'suspended audio contexts should install the first-interaction unlock');
assert.match(js, /function unlockAudio\(\) \{[\s\S]*stopBackgroundMusic\(\);[\s\S]*startStartScreenMusic\(\);[\s\S]*\}/, 'first interaction should restart start-screen music while ready or gameover');
assert.match(js, /startMusicMode\('start-screen', \['ready', 'gameover'\]/, 'start-screen music should be limited to ready and gameover states');
assert.match(js, /function startIntroMusic\(\) \{[\s\S]*startStartScreenMusic\(\);[\s\S]*\}/, 'start game screen should expose intro music that starts the ready-screen loop');
assert.match(js, /startIntroMusic\(\);\ndraw\(\);/, 'intro music should be attempted after the ready overlay is shown');
assert.match(js, /playTone\(melody\[musicStep % melody\.length\], 0\.16, 'triangle', 0\.0675\)/, 'background melody should be 50% louder');
assert.match(js, /playTone\(bass\[musicStep % bass\.length\], 0\.18, 'sine', 0\.048\)/, 'background bass should be 50% louder');
assert.match(js, /function playSecretUnlockSound\(\) \{[\s\S]*playScoreSound\(\);[\s\S]*\}/, 'correct secret code should reuse the existing happy score sound');
assert.match(js, /function playSecretFailureSound\(\) \{[\s\S]*playGameOverSound\(\);[\s\S]*\}/, 'wrong secret code should reuse the existing failure game-over sound');
assert.match(js, /enteredCode !== SECRET_UNLOCK_CODE[\s\S]*playSecretFailureSound\(\)/, 'wrong secret code should play the failure sound');
assert.match(js, /secretCharacterUnlocked = true;[\s\S]*playSecretUnlockSound\(\)/, 'correct secret code should play the happy unlock sound');
assert.match(js, /startMusicMode\('gameplay', \['playing'\]/, 'gameplay music should be limited to playing state');
assert.match(js, /if \(state === 'playing'\) startGameplayMusic\(\)/, 'background music dispatcher should choose gameplay music while playing');
assert.match(js, /else if \(state === 'ready' \|\| state === 'gameover'\) startStartScreenMusic\(\)/, 'background music dispatcher should choose start-screen music outside gameplay');
assert.notEqual(
  js.match(/startMusicMode\('start-screen', \['ready', 'gameover'\], \[([^\]]+)\]/)?.[1],
  js.match(/startMusicMode\('gameplay', \['playing'\], \[([^\]]+)\]/)?.[1],
  'start-screen and gameplay music should use different generated melodies'
);

console.log('audio checks passed');
