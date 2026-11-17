// Screenshot scenes. The maker renders the game's own code in a browser with
// ?shot=<name>&seed=<n> and captures the frame: the scene functions below pose
// a deterministic mid-game moment (same seed, same frame) so the screenshots
// are real renders of the real game, reproducible by anyone.

import { PLANET, ENEMIES, STORY, nightOf } from './config.js';
import { reseed, rand, randRange } from './random.js';

function poseEnemies(world, list) {
  for (const [kind, dist, deg] of list) {
    const a = (deg * Math.PI) / 180;
    const spec = ENEMIES[kind];
    world.enemies.push({
      kind,
      x: PLANET.x + Math.cos(a) * dist,
      y: PLANET.y + Math.sin(a) * dist,
      radius: spec.radius,
      hp: spec.hp,
      maxHp: spec.hp,
      speed: spec.speed,
      wobble: rand() * Math.PI * 2,
      spin: 0.6,
      rot: rand() * Math.PI * 2,
      flash: 0,
      seed: rand() * 1000,
    });
  }
}

function poseBolts(world, count) {
  for (let i = 0; i < count; i++) {
    const a = randRange(-0.7, 0.5);
    const d = randRange(180, 430);
    world.bolts.push({
      x: PLANET.x + Math.cos(a) * d,
      y: PLANET.y + Math.sin(a) * d,
      vx: Math.cos(a) * 780,
      vy: Math.sin(a) * 780,
      life: 1,
      damage: 1,
    });
  }
}

function poseParticles(world, count) {
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const d = randRange(200, 460);
    world.particles.push({
      x: PLANET.x + Math.cos(a) * d,
      y: PLANET.y + Math.sin(a) * d,
      vx: randRange(-30, 30),
      vy: randRange(-30, 30),
      life: randRange(0.4, 0.8),
      maxLife: 0.8,
      size: randRange(1.5, 3.4),
      color: ['#ff9e5d', '#ffd166', '#57b6ff'][i % 3],
    });
  }
}

export function poseScene(world, input, name, seed) {
  reseed(seed * 7919 + 13);
  world.time = 3.2;
  if (name === 'start') {
    world.phase = 'title';
    poseEnemies(world, [
      ['asteroid', 430, 205],
      ['drone', 380, 320],
      ['asteroid', 470, 30],
    ]);
    input.mouseX = PLANET.x + 260;
    input.mouseY = PLANET.y - 190;
    return;
  }
  if (name === 'play') {
    world.phase = 'playing';
    world.wave = 3;
    world.score = 4870;
    world.credits = 132;
    world.kills = 41;
    world.shield = 76;
    world.novaCharges = 2;
    world.guardianAngle = -0.6;
    poseEnemies(world, [
      ['drone', 240, -38],
      ['drone', 300, -12],
      ['weaver', 350, 24],
      ['asteroid', 300, 130],
      ['asteroid', 420, 168],
      ['carrier', 470, 262],
      ['drone', 390, 300],
      ['weaver', 260, 205],
    ]);
    poseBolts(world, 7);
    poseParticles(world, 26);
    world.cores.push({ x: PLANET.x + 210, y: PLANET.y + 120, vx: 0, vy: 0, radius: 9, life: 8 });
    world.floaters.push({ x: PLANET.x + 300, y: PLANET.y - 60, text: '+120', color: '#ffe066', life: 0.8 });
    input.mouseX = PLANET.x + 330;
    input.mouseY = PLANET.y - 130;
    return;
  }
  if (name === 'shop') {
    world.phase = 'shop';
    world.wave = 3;
    world.score = 5210;
    world.credits = 214;
    world.kills = 48;
    world.shield = 64;
    world.novaCharges = 1;
    world.levels = { rapid: 2, twin: 1, regen: 1, over: 0 };
    world.logLine = nightOf(world.wave).log;
    poseEnemies(world, [['asteroid', 480, 140]]);
    input.mouseX = PLANET.x;
    input.mouseY = PLANET.y - 300;
    return;
  }
  // 'end'
  world.phase = 'over';
  world.finalWave = 7;
  world.wave = 7;
  world.score = 18930;
  world.kills = 163;
  world.shield = 0;
  world.epitaphLine = STORY.epitaph(world.finalWave);
  poseParticles(world, 60);
  input.mouseX = PLANET.x + 100;
  input.mouseY = PLANET.y + 100;
}
