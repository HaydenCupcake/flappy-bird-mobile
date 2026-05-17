import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'style.css'), 'utf8');
const canvasWrapBlock = css.match(/\.canvas-wrap \{[\s\S]*?\n\}/)?.[0] || '';

assert.match(html, /<div class="app-viewport">[\s\S]*<main class="game-shell"/, 'game shell should sit inside a fixed viewport wrapper for true centering');
assert.match(
  css,
  /\.app-viewport \{[\s\S]*position: fixed;[\s\S]*inset: 0;[\s\S]*display: grid;[\s\S]*place-items: center;[\s\S]*overflow: hidden;/,
  'app viewport should own fixed full-screen centering without page overflow'
);
assert.match(
  css,
  /\.app-viewport \{[\s\S]*padding: env\(safe-area-inset-top\) env\(safe-area-inset-right\) env\(safe-area-inset-bottom\) env\(safe-area-inset-left\);/,
  'safe-area padding should be applied inside the fixed viewport wrapper only'
);
assert.match(css, /body \{[\s\S]*padding: 0;/, 'body padding should not combine with 100dvh and create mobile overflow');
assert.match(css, /body \{[\s\S]*width: 100%;/, 'body should not be wider than the viewport');
assert.doesNotMatch(css, /body \{[\s\S]*height: 100dvh;[\s\S]*padding: max\(/, 'body should not mix full dynamic viewport height with safe-area padding');

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
assert.match(css, /\.game-shell \{[\s\S]*height: 100%;[\s\S]*overflow: hidden;[\s\S]*width: min\(100vw, 560px\);/, 'game shell should fit the viewport width without exceeding it');
assert.match(canvasWrapBlock, /min-height: 0;/, 'canvas wrapper should be allowed to shrink inside the viewport grid');
assert.match(canvasWrapBlock, /height: auto;/, 'canvas wrapper should size from width plus aspect ratio instead of forcing width overflow from a full-height row');
assert.doesNotMatch(canvasWrapBlock, /height: 100%;/, 'canvas wrapper should not force full row height because that can overflow the phone width');
assert.match(canvasWrapBlock, /margin: auto;[\s\S]*justify-self: center;[\s\S]*align-self: center;/, 'canvas wrapper should center itself inside the shrinking grid row');
assert.match(canvasWrapBlock, /width: min\(100%, calc\(100vw - 16px\), calc\(\(100dvh - 236px\) \* 9 \/ 16\), 560px\);/, 'canvas width should be capped from viewport width and remaining viewport height so the full 9:16 game area fits on phones');
assert.doesNotMatch(css, /max-height: min\(56svh, calc\(100dvh - 252px\)\)/, 'compact canvas should not use a fixed viewport subtraction that can still clip on phones');

assert.match(
  css,
  /\.controls \{[\s\S]*display: grid;[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[\s\S]*width: 100%;/,
  'mobile controls should use three equal shrinking columns instead of overflowing as a flex row'
);
assert.match(
  css,
  /\.flap-button,[\s\S]*\.secondary-button \{[\s\S]*min-width: 0;/,
  'control buttons should be allowed to shrink within their grid columns'
);
assert.match(
  css,
  /#selectedCharacterText \{[\s\S]*min-width: 0;[\s\S]*overflow-wrap: anywhere;/,
  'selected character label should wrap instead of being cut off on narrow phones'
);

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
