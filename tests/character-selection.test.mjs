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
assert.match(html, /data-character="duck"/, '30-point duck option should exist in locked state');
assert.match(html, /<span>Duck<\/span>/, 'duck option should be labeled Duck');
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
assert.match(js, /id: 'duck'/, 'duck character should be defined');
assert.match(js, /name: 'Emerald Duck'/, 'duck character should be named');
assert.match(js, /unlockScore: 30/, 'duck should unlock when the player reaches 30 points');
assert.match(js, /species: 'duck'/, 'duck character should use duck-specific drawing and audio behavior');
assert.match(js, /body: '#16a34a'/, 'duck should use a green body');
assert.match(js, /crest: '#f8fafc'/, 'duck should use white feathers');
assert.match(js, /STORAGE_KEY_CHARACTER/, 'selected non-secret character should be persisted');
assert.doesNotMatch(js, /STORAGE_KEY_SECRET_CHARACTER/, 'secret unlock should reset each time the game page starts');
assert.doesNotMatch(js, /localStorage\.setItem\([^)]*SECRET/i, 'secret unlock should not be saved to localStorage');
assert.match(js, /let secretCharacterUnlocked = false;/, 'secret character should start locked for each page session');
assert.match(js, /SECRET_UNLOCK_CODE = 'ilove67'/, 'secret unlock code should be ilove67');
assert.match(js, /function selectCharacter/, 'character selection handler should exist');
assert.match(js, /Enter the secret code to unlock this character\./, 'locked secret character click should show the requested unlock message');
assert.match(js, /function unlockSecretCharacter/, 'secret character unlock handler should exist');
assert.match(js, /function syncSecretCharacterLockState/, 'secret character should stay locked until code entry');
assert.match(js, /character\.unlockScore <= Math\.max\(score, bestScore\)/, 'score-locked characters should unlock at their score threshold');
assert.match(js, /score \+= 1;[\s\S]*syncSecretCharacterLockState\(\)/, 'character locks should refresh when scoring points');
assert.match(js, /function drawCharacterPreview/, 'character picker preview renderer should exist');
assert.match(js, /function drawBirdSprite/, 'game bird should be drawn from selected character data');
assert.match(js, /character\.badge === '67'/, 'bird sprite should draw a 67 badge for the secret character');
assert.match(js, /character\.species === 'duck'/, 'duck sprite should draw duck-specific details');
assert.match(js, /fillRect\(12, -7, 26, 12\)/, 'duck should have a longer bill');
assert.match(js, /font = '900 16px monospace'/, 'secret 67 badge digits should be even larger');

console.log('character-selection checks passed');
