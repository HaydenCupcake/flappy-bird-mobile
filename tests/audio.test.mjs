import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const html = readFileSync(join(root, 'index.html'), 'utf8');
const js = readFileSync(join(root, 'game.js'), 'utf8');

assert.match(html, /id="soundButton"/, 'sound toggle button should exist');
assert.match(html, /aria-label="Enable sound"/, 'sound button should expose its purpose');

assert.match(js, /STORAGE_KEY_AUDIO = 'sky-hopper-audio-enabled'/, 'audio preference localStorage key should exist');
assert.match(js, /localStorage\.getItem\(STORAGE_KEY_AUDIO\) === 'true'/, 'audio should default off unless persisted on');
assert.match(js, /localStorage\.setItem\(STORAGE_KEY_AUDIO, String\(soundEnabled\)\)/, 'audio preference should persist');
assert.match(js, /selectCharacter\(selectedCharacterId, false\)/, 'initial character render should not autoplay audio');
assert.match(js, /window\.AudioContext \|\| window\.webkitAudioContext/, 'Web Audio API setup should support browser prefixes');
assert.match(js, /createOscillator\(/, 'generated audio should use oscillators');
assert.match(js, /createGain\(/, 'generated audio should use gain nodes');

[
  'setupAudio',
  'toggleSound',
  'startBackgroundMusic',
  'stopBackgroundMusic',
  'playFlapSound',
  'playScoreSound',
  'playCharacterSelectSound',
  'playPauseSound',
  'playResumeSound',
  'playGameOverSound',
].forEach((name) => {
  assert.match(js, new RegExp(`function ${name}\\(`), `${name} should be defined`);
});

assert.match(js, /startBackgroundMusic\(\)/, 'music should be started by gameplay flow');
assert.match(js, /stopBackgroundMusic\(\)/, 'music should be stopped by pause, game over, or visibility flow');

console.log('audio checks passed');
