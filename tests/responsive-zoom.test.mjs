import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'style.css'), 'utf8');
const js = readFileSync(join(root, 'game.js'), 'utf8');

assert.match(
  html,
  /<meta name="viewport" content="[^"]*width=device-width[^"]*initial-scale=1[^"]*maximum-scale=1[^"]*user-scalable=no[^"]*viewport-fit=cover[^"]*">/,
  'viewport meta should prevent browser zoom while respecting safe-area insets'
);

assert.match(css, /html,\s*body \{[\s\S]*overscroll-behavior: none;/, 'page should suppress browser rubber-band overscroll');
assert.match(css, /html,\s*body \{[\s\S]*touch-action: none;/, 'page should disable browser touch gestures globally');
assert.match(css, /body \{[\s\S]*overflow: hidden;/, 'body should avoid page scrolling');
assert.match(css, /\.app-viewport \{[\s\S]*position: fixed;[\s\S]*inset: 0;[\s\S]*height: 100dvh;[\s\S]*overflow: hidden;/, 'fixed app viewport should lock to the dynamic viewport and avoid page scrolling');
assert.match(css, /\.game-shell \{[\s\S]*height: 100%;[\s\S]*max-height: 100%;/, 'game shell should fit inside the visible dynamic viewport wrapper');
assert.match(css, /\.canvas-wrap \{[\s\S]*max-height: min\([^;]*100dvh[^;]*\);[\s\S]*max-width: min\(100%, 560px\);/, 'canvas wrapper should cap itself with dynamic viewport height and content width');
assert.doesNotMatch(css, /\.canvas-wrap \{[\s\S]*max-width:[^;]*100vw/, 'canvas wrapper should not use raw viewport width inside the fixed inset shell');
assert.match(css, /@media \(max-width: 759px\), \(max-height: 820px\)/, 'compact screens should use a dedicated fit rule');
assert.match(css, /\.controls \{[\s\S]*touch-action: manipulation;/, 'buttons may keep low-latency tap behavior without enabling page zoom');

assert.match(js, /let lastTouchEnd = 0;/, 'double-tap prevention should track recent touch endings');
assert.match(js, /function preventGestureZoom\(event\)/, 'multi-touch gesture prevention handler should exist');
assert.match(js, /if \(event\.touches && event\.touches\.length > 1\) \{[\s\S]*event\.preventDefault\(\);[\s\S]*\}/, 'multi-touch gestures should be cancelled before pinch zoom starts');
assert.match(js, /function preventDoubleTapZoom\(event\)/, 'double-tap zoom prevention handler should exist');
assert.match(js, /Date\.now\(\) - lastTouchEnd <= 300[\s\S]*event\.preventDefault\(\)/, 'rapid repeated taps should be cancelled to prevent double-tap zoom');
assert.match(js, /document\.addEventListener\('touchstart', preventGestureZoom, \{ passive: false \}\)/, 'touchstart listener must be non-passive so pinch zoom can be prevented');
assert.match(js, /document\.addEventListener\('touchend', preventDoubleTapZoom, \{ passive: false \}\)/, 'touchend listener must be non-passive so double-tap zoom can be prevented');
assert.match(js, /document\.addEventListener\('gesturestart', preventGestureZoom, \{ passive: false \}\)/, 'Safari gesturestart should be prevented when supported');

console.log('responsive zoom checks passed');
