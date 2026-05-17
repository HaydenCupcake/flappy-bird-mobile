# Sky Hopper Arcade

A polished Flappy Bird-style mobile web game built with pure static HTML, CSS, and JavaScript. No npm, build step, external assets, or third-party dependencies are required.

## Play

Open `index.html` in a browser, or publish the repo with GitHub Pages.

Controls:

- Tap or click anywhere on the game canvas to flap.
- Pick Classic, Ruby, or Midnight from the bird selector before or between runs.
- Tap Secret on the start screen and enter `ilove67` to unlock the hidden Six Seven bird.
- Use the on-screen Flap button on touch devices.
- Use the Sound On/Sound Off button to mute or enable generated music and effects.
- Press `Space` or `ArrowUp` to flap.
- Press `P` or the Pause button to pause/resume.

## Features

- Responsive HTML5 canvas for phone portrait and desktop browsers.
- Start screen, pause/resume, visibility auto-pause, game over, and restart flow.
- Score display and best score saved with `localStorage`.
- Four selectable bird characters with the current pick saved on this device, including a hidden Six Seven bird unlocked with the secret code.
- Browser-safe generated Web Audio: sound on by default, start-screen music attempts to play on load when browsers allow it, saved sound preference, separate start-screen and gameplay music loops, and effects for flaps, gates, selection, pause/resume, and game over.
- Increasing speed and tighter gate spacing as your score rises.
- Original pixel-art arcade visuals with no copyrighted Flappy Bird assets.
- Accessible visible instructions and keyboard controls.

## GitHub Pages

This project is ready for GitHub Pages because it is static-only.

1. Push the repository to GitHub.
2. In the repository settings, enable Pages.
3. Choose the branch containing `index.html` as the Pages source.
4. Visit the generated Pages URL.
