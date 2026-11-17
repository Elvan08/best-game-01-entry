// AEGIS ORBIT — THE LAST KEEPER. Boot and the frame loop. States move like
// this: title --click--> night 1..n --night held--> shipyard --enter--> next
// night, and shield 0 --> the light goes out --click--> a fresh watch.

import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createWorld } from './world.js';
import { render } from './render.js';
import { poseScene } from './shots.js';
import { SHOP } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();
const game = createWorld(audio);
const { world } = game;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
if (shotName) {
  // A posed screenshot scene: render exactly one deterministic frame.
  poseScene(world, input, shotName, Number(params.get('seed') || 1));
  render(ctx, world, input, game.shopPrice);
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (input.pressed.has('KeyM')) audio.toggleMute();
    if ((input.pressed.has('KeyP') || input.pressed.has('Escape')) && world.phase === 'playing') world.paused = !world.paused;

    if (world.phase === 'title' && (input.clicked || input.pressed.has('Enter'))) {
      audio.unlock();
      game.startRun();
    } else if (world.phase === 'over' && (input.clicked || input.pressed.has('Enter'))) {
      audio.unlock();
      game.startRun();
    } else if (world.phase === 'shop') {
      for (let i = 0; i < SHOP.length; i++) {
        if (input.pressed.has(`Digit${i + 1}`)) game.buy(SHOP[i]);
      }
      if (input.pressed.has('Enter')) game.startWave(world.wave + 1);
    }

    game.update(dt, input);
    render(ctx, world, input, game.shopPrice);
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
