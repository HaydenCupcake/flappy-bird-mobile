import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'style.css'), 'utf8');

assert.match(html, /<p class="screen-reader-note">/, 'screen-reader note should remain in the document for assistive tech');
assert.match(
  css,
  /\.screen-reader-note \{[\s\S]*position: absolute;[\s\S]*width: 1px;[\s\S]*height: 1px;[\s\S]*overflow: hidden;[\s\S]*clip: rect\(0 0 0 0\);[\s\S]*white-space: nowrap;/,
  'screen-reader note should be visually hidden instead of consuming layout height'
);

assert.match(
  css,
  /\.game-shell \{[\s\S]*grid-template-rows: auto minmax\(0, 1fr\) auto auto;[\s\S]*min-height: 0;/,
  'game shell should reserve the shrinking row for the canvas and avoid an extra visible note row'
);
assert.match(css, /\.canvas-wrap \{[\s\S]*min-height: 0;/, 'canvas wrapper should be allowed to shrink inside the viewport grid');
assert.match(css, /\.canvas-wrap \{[\s\S]*height: 100%;/, 'canvas wrapper should fill only the available shrinking grid row');
assert.doesNotMatch(css, /max-height: min\(56svh, calc\(100dvh - 252px\)\)/, 'compact canvas should not use a fixed viewport subtraction that can still clip on phones');

assert.match(
  css,
  /@media \(max-width: 759px\), \(max-height: 820px\) \{[\s\S]*\.character-options \{[\s\S]*display: flex;[\s\S]*overflow-x: auto;[\s\S]*scrollbar-width: none;/,
  'compact character picker should scroll horizontally instead of adding vertical rows'
);
assert.match(
  css,
  /@media \(max-width: 759px\), \(max-height: 820px\) \{[\s\S]*\.character-option \{[\s\S]*min-width: 64px;[\s\S]*min-height: 58px;/,
  'compact character buttons should be short enough to prioritize the canvas'
);
assert.match(
  css,
  /@media \(max-width: 759px\), \(max-height: 820px\) \{[\s\S]*\.flap-button,[\s\S]*\.secondary-button \{[\s\S]*min-height: 44px;/,
  'compact controls should shrink vertical button height on small screens'
);
assert.match(
  css,
  /@media \(max-width: 759px\), \(max-height: 820px\) \{[\s\S]*\.panel \{[\s\S]*max-height: calc\(100% - 16px\);[\s\S]*overflow: auto;/,
  'overlay panel should scroll within the canvas instead of overflowing it'
);

console.log('mobile layout checks passed');
