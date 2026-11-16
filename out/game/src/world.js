// AEGIS ORBIT — the world: state, spawning, combat, waves and the shop.
// Rendering lives in render.js; this file never touches the canvas.

import { PLANET, GUARDIAN, NOVA, ENEMIES, SHOP, wavePlan } from './config.js';
import { rand, randRange } from './random.js';

export function createWorld(audio) {
  const world = {
    phase: 'title', // title | playing | shop | over
    time: 0,
    wave: 0,
    score: 0,
    credits: 0,
    kills: 0,
    shield: PLANET.maxShield,
    novaCharges: NOVA.startCharges,
    guardianAngle: -Math.PI / 2,
    fireCooldown: 0,
    shake: 0,
    flash: 0,
    bolts: [],
    enemies: [],
    particles: [],
    floaters: [], // rising "+40" score texts
    cores: [], // star cores drifting in; shoot one to bank a nova charge
    spawnQueue: [],
    spawnTimer: 0,
    waveClearTimer: 0,
    paused: false,
    levels: { rapid: 0, twin: 0, regen: 0, over: 0 },
    message: '',
    messageTimer: 0,
    finalWave: 0,
  };

  const fireInterval = () => GUARDIAN.baseFireInterval * Math.pow(0.82, world.levels.rapid);
  const boltDamage = () => GUARDIAN.baseDamage + world.levels.over;
  const boltCount = () => 1 + world.levels.twin;
  const regenRate = () => world.levels.regen * 0.55;

  function shopPrice(item) {
    if (item.id === 'nova') return item.base;
    const lvl = world.levels[item.id] || 0;
    return Math.round(item.base * Math.pow(item.growth, lvl));
  }

  function spawnEnemy(kind) {
    const spec = ENEMIES[kind];
    const angle = rand() * Math.PI * 2;
    const dist = randRange(560, 700);
    const enemy = {
      kind,
      x: PLANET.x + Math.cos(angle) * dist,
      y: PLANET.y + Math.sin(angle) * dist,
      radius: spec.radius * randRange(0.85, 1.2),
      hp: spec.hp,
      maxHp: spec.hp,
      speed: spec.speed * wavePlan(world.wave).speedScale * randRange(0.85, 1.15),
      wobble: rand() * Math.PI * 2,
      spin: randRange(-1.4, 1.4),
      rot: rand() * Math.PI * 2,
      flash: 0,
      seed: rand() * 1000,
    };
    world.enemies.push(enemy);
  }

  function burst(x, y, color, count, speed = 190) {
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const s = randRange(speed * 0.25, speed);
      world.particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: randRange(0.3, 0.8),
        maxLife: 0.8,
        size: randRange(1.5, 3.6),
        color,
      });
    }
  }

  function floater(x, y, text, color) {
    world.floaters.push({ x, y, text, color, life: 0.9 });
  }

  function startWave(n) {
    world.wave = n;
    const plan = wavePlan(n);
    const queue = [];
    const add = (kind, count) => { for (let i = 0; i < count; i++) queue.push(kind); };
    add('asteroid', plan.asteroids);
    add('drone', plan.drones);
    add('weaver', plan.weavers);
    add('carrier', plan.carriers);
    // Shuffle so kinds interleave instead of arriving in blocks.
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    world.spawnQueue = queue;
    world.spawnTimer = 0.6;
    world.phase = 'playing';
    world.message = `WAVE ${n}`;
    world.messageTimer = 2.0;
    audio.waveStart();
  }

  function startRun() {
    world.score = 0;
    world.credits = 0;
    world.kills = 0;
    world.shield = PLANET.maxShield;
    world.novaCharges = NOVA.startCharges;
    world.bolts = [];
    world.enemies = [];
    world.particles = [];
    world.floaters = [];
    world.cores = [];
    world.levels = { rapid: 0, twin: 0, regen: 0, over: 0 };
    world.shake = 0;
    startWave(1);
  }

  function fireBolts(aimAngle) {
    const gx = PLANET.x + Math.cos(world.guardianAngle) * PLANET.orbitRadius;
    const gy = PLANET.y + Math.sin(world.guardianAngle) * PLANET.orbitRadius;
    const n = boltCount();
    for (let i = 0; i < n; i++) {
      const spread = (i - (n - 1) / 2) * 0.055;
      const a = aimAngle + spread;
      world.bolts.push({
        x: gx + Math.cos(a) * (GUARDIAN.radius + 6),
        y: gy + Math.sin(a) * (GUARDIAN.radius + 6),
        vx: Math.cos(a) * GUARDIAN.boltSpeed,
        vy: Math.sin(a) * GUARDIAN.boltSpeed,
        life: GUARDIAN.boltLife,
        damage: boltDamage(),
      });
    }
    burst(gx + Math.cos(aimAngle) * 18, gy + Math.sin(aimAngle) * 18, '#ffe066', 3, 90);
    audio.shoot();
  }

  function detonateNova() {
    if (world.novaCharges <= 0) {
      audio.denied();
      return;
    }
    world.novaCharges -= 1;
    world.flash = 0.85;
    world.shake = Math.max(world.shake, 13);
    for (const e of [...world.enemies]) {
      const d = Math.hypot(e.x - PLANET.x, e.y - PLANET.y);
      if (d < NOVA.radius) killEnemy(e, false);
    }
    world.cores = [];
    audio.nova();
  }

  function killEnemy(e, award = true) {
    const spec = ENEMIES[e.kind];
    world.enemies.splice(world.enemies.indexOf(e), 1);
    if (award) {
      world.score += spec.score;
      world.credits += spec.credits;
      world.kills += 1;
      floater(e.x, e.y, `+${spec.score}`, '#ffe066');
      // Star cores: roughly one in nine kills drops one, carriers always do.
      if (e.kind === 'carrier' || rand() < 0.11) {
        world.cores.push({ x: e.x, y: e.y, vx: randRange(-24, 24), vy: randRange(-24, 24), radius: 9, life: 9 });
      }
    }
    burst(e.x, e.y, e.kind === 'asteroid' ? '#b08968' : '#ff9e5d', e.kind === 'carrier' ? 30 : 15, e.kind === 'carrier' ? 260 : 200);
    audio.boom(e.kind === 'carrier');
    if (e.kind === 'carrier') world.shake = Math.max(world.shake, 7);
  }

  function planetStruck(e) {
    const spec = ENEMIES[e.kind];
    world.enemies.splice(world.enemies.indexOf(e), 1);
    world.shield -= spec.damage;
    world.shake = Math.max(world.shake, 10);
    world.flash = Math.max(world.flash, 0.35);
    burst(e.x, e.y, '#ff5d73', 22, 240);
    floater(PLANET.x, PLANET.y - PLANET.radius - 26, `-${spec.damage} SHIELD`, '#ff5d73');
    audio.planetHit();
    if (world.shield <= 0) {
      world.shield = 0;
      world.phase = 'over';
      world.finalWave = world.wave;
      burst(PLANET.x, PLANET.y, '#57b6ff', 90, 380);
      burst(PLANET.x, PLANET.y, '#ff5d73', 60, 300);
      audio.gameOver();
    }
  }

  function buy(item) {
    if (item.id === 'nova') {
      if (world.novaCharges >= NOVA.maxCharges) { audio.denied(); return; }
    } else if ((world.levels[item.id] || 0) >= item.max) { audio.denied(); return; }
    const price = shopPrice(item);
    if (world.credits < price) { audio.denied(); return; }
    world.credits -= price;
    if (item.id === 'nova') world.novaCharges += 1;
    else world.levels[item.id] += 1;
    audio.buy();
  }

  function update(dt, input) {
    world.time += dt;
    if (world.messageTimer > 0) world.messageTimer -= dt;
    world.shake = Math.max(0, world.shake - dt * 26);
    world.flash = Math.max(0, world.flash - dt * 1.7);
    if (world.phase === 'playing' && regenRate() > 0) {
      world.shield = Math.min(PLANET.maxShield, world.shield + regenRate() * dt);
    }

    // Particles and floaters always drift, whatever the phase.
    for (const p of world.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
    }
    world.particles = world.particles.filter((p) => p.life > 0);
    for (const f of world.floaters) {
      f.y -= 34 * dt;
      f.life -= dt;
    }
    world.floaters = world.floaters.filter((f) => f.life > 0);

    if (world.phase !== 'playing' || world.paused) return;

    // Keyboard orbit: A/D or the arrow keys swing the guardian around its
    // ring, so the game plays fully without a mouse. While a key is held it
    // wins over the pointer; the cannon still aims at the pointer.
    const orbitKeys = input.keys.has('KeyA') || input.keys.has('ArrowLeft')
      ? -1
      : input.keys.has('KeyD') || input.keys.has('ArrowRight')
        ? 1
        : 0;
    if (orbitKeys !== 0) world.guardianAngle += orbitKeys * 2.7 * dt;

    // Aim: the guardian rides its ring toward the pointer's angle.
    const aim = Math.atan2(input.mouseY - PLANET.y, input.mouseX - PLANET.x);
    let diff = aim - world.guardianAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    world.guardianAngle += diff * Math.min(1, dt * 14);

    world.fireCooldown -= dt;
    if (input.mouseDown && world.fireCooldown <= 0) {
      fireBolts(aim);
      world.fireCooldown = fireInterval();
    }
    if (input.pressed.has('Space')) detonateNova();

    // Spawning.
    if (world.spawnQueue.length > 0) {
      world.spawnTimer -= dt;
      if (world.spawnTimer <= 0) {
        spawnEnemy(world.spawnQueue.shift());
        world.spawnTimer = wavePlan(world.wave).spawnGap * randRange(0.7, 1.3);
      }
    }

    // Bolts.
    for (const b of world.bolts) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
    }
    world.bolts = world.bolts.filter((b) => b.life > 0);

    // Enemies home in on the planet; weavers sine across their path.
    for (const e of [...world.enemies]) {
      const dx = PLANET.x - e.x;
      const dy = PLANET.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      let mx = (dx / d) * e.speed;
      let my = (dy / d) * e.speed;
      if (e.kind === 'weaver') {
        const px = -dy / d;
        const py = dx / d;
        const sway = Math.sin(world.time * 3.1 + e.wobble) * 46;
        mx += px * sway;
        my += py * sway;
      }
      e.x += mx * dt;
      e.y += my * dt;
      e.rot += e.spin * dt;
      e.flash = Math.max(0, e.flash - dt * 6);
      if (d < PLANET.radius + e.radius * 0.55) planetStruck(e);
    }

    // Bolt hits.
    for (const b of [...world.bolts]) {
      let consumed = false;
      for (const e of [...world.enemies]) {
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + GUARDIAN.boltRadius) {
          e.hp -= b.damage;
          e.flash = 1;
          burst(b.x, b.y, '#ffd166', 4, 130);
          if (e.hp <= 0) killEnemy(e);
          else audio.hit();
          consumed = true;
          break;
        }
      }
      if (!consumed) {
        for (const c of [...world.cores]) {
          if (Math.hypot(b.x - c.x, b.y - c.y) < c.radius + GUARDIAN.boltRadius + 3) {
            world.cores.splice(world.cores.indexOf(c), 1);
            if (world.novaCharges < NOVA.maxCharges) {
              world.novaCharges += 1;
              floater(c.x, c.y, '+1 NOVA', '#59ffc8');
            } else {
              world.score += 150;
              floater(c.x, c.y, '+150', '#59ffc8');
            }
            burst(c.x, c.y, '#59ffc8', 16, 200);
            audio.pickup();
            consumed = true;
            break;
          }
        }
      }
      if (consumed) world.bolts.splice(world.bolts.indexOf(b), 1);
    }

    // Cores drift and fade.
    for (const c of world.cores) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.life -= dt;
    }
    world.cores = world.cores.filter((c) => c.life > 0);

    // Wave cleared: a breath, then the shop.
    if (world.spawnQueue.length === 0 && world.enemies.length === 0 && world.phase === 'playing') {
      world.waveClearTimer += dt;
      if (world.waveClearTimer > 1.1) {
        world.waveClearTimer = 0;
        world.phase = 'shop';
        const bonus = 100 * world.wave;
        world.score += bonus;
        floater(PLANET.x, PLANET.y - PLANET.radius - 30, `WAVE BONUS +${bonus}`, '#59ffc8');
      }
    } else {
      world.waveClearTimer = 0;
    }
  }

  return { world, startRun, startWave, buy, shopPrice, update };
}
