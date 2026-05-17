import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'style.css'), 'utf8');
const js = readFileSync(join(root, 'game.js'), 'utf8');

assert.match(html, /aria-label="Choose your bird character"/, 'character picker should be exposed to assistive tech');
assert.match(html, /data-character="classic"/, 'classic bird option should exist');
assert.match(html, /data-character="ruby"/, 'ruby bird option should exist');
assert.match(html, /data-character="midnight"/, 'midnight bird option should exist');
assert.match(html, /data-character="sixseven"/, 'secret 6/7 bird option should exist in locked state');
assert.match(html, /id="selectedCharacterText"/, 'selected character label should exist');
assert.match(html, /id="secretButton"[^>]*>Secret<\/button>/, 'secret unlock button should sit on the start overlay');
assert.match(html, /id="secretCodeInput"/, 'secret code input should exist for unlock flow');
assert.match(html, /id="secretSubmitButton"/, 'secret code submit button should exist');

assert.match(css, /\.character-picker/, 'character picker styles should exist');
assert.match(css, /\.character-option\.selected/, 'selected character styling should exist');
assert.match(css, /\.secret-unlock/, 'secret unlock form styling should exist');
assert.match(css, /\.character-option\.locked/, 'locked secret character styling should exist');

assert.match(js, /const CHARACTERS = \[/, 'character definitions should exist');
assert.match(js, /id: 'sixseven'/, 'secret 6/7 character should be defined');
assert.match(js, /name: 'Six Seven'/, 'secret character should be named for 6 and 7');
assert.match(js, /STORAGE_KEY_CHARACTER/, 'selected character should be persisted');
assert.match(js, /STORAGE_KEY_SECRET_CHARACTER/, 'secret unlock should be persisted');
assert.match(js, /SECRET_UNLOCK_CODE = 'ilove67'/, 'secret unlock code should be ilove67');
assert.match(js, /function selectCharacter/, 'character selection handler should exist');
assert.match(js, /function unlockSecretCharacter/, 'secret character unlock handler should exist');
assert.match(js, /function syncSecretCharacterLockState/, 'secret character should stay locked until code entry');
assert.match(js, /function drawCharacterPreview/, 'character picker preview renderer should exist');
assert.match(js, /function drawBirdSprite/, 'game bird should be drawn from selected character data');
assert.match(js, /character\.badge === '67'/, 'bird sprite should draw a 67 badge for the secret character');
assert.match(js, /font = '900 16px monospace'/, 'secret 67 badge digits should be even larger');

console.log('character-selection checks passed');
