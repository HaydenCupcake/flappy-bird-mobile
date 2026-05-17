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
assert.match(html, /id="selectedCharacterText"/, 'selected character label should exist');

assert.match(css, /\.character-picker/, 'character picker styles should exist');
assert.match(css, /\.character-option\.selected/, 'selected character styling should exist');

assert.match(js, /const CHARACTERS = \[/, 'character definitions should exist');
assert.match(js, /STORAGE_KEY_CHARACTER/, 'selected character should be persisted');
assert.match(js, /function selectCharacter/, 'character selection handler should exist');
assert.match(js, /function drawCharacterPreview/, 'character picker preview renderer should exist');
assert.match(js, /function drawBirdSprite/, 'game bird should be drawn from selected character data');

console.log('character-selection checks passed');
