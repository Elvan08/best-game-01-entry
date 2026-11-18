// AEGIS ORBIT — rendering. Pure canvas 2D: a banded gas-giant planet with a
// glowing atmosphere, a parallax starfield, polygon ships and rocks, and a
// HUD that reads at a glance. Screens (title, shop, game over) draw here too.

import { VIEW, PLANET, GUARDIAN, NOVA, SHOP, COLORS, BOSS, BLESSINGS, BLESSING_INTRO, bossOf, nightOf } from './config.js';
import { rand, reseed } from './random.js';

// Fixed starfield, generated once from a seed so every frame agrees.
const STARS = [];
reseed(20261116);
for (let i = 0; i < 190; i++) {
  STARS.push({
    x: rand() * VIEW.w,
    y: rand() * VIEW.h,
    r: 0.6 + rand() * 1.7,
    depth: 0.25 + rand() * 0.75,
    tw: rand() * Math.PI * 2,
  });
}

function drawBackground(ctx, time) {
  const g = ctx.createRadialGradient(PLANET.x, PLANET.y, 80, PLANET.x, PLANET.y, 760);
  g.addColorStop(0, '#0a1730');
  g.addColorStop(0.45, '#060d20');
  g.addColorStop(1, COLORS.ink);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  for (const s of STARS) {
    const a = 0.35 + 0.4 * s.depth + 0.25 * Math.sin(time * 1.7 + s.tw);
    ctx.globalAlpha = Math.max(0.08, a);
    ctx.fillStyle = COLORS.star;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPlanet(ctx, world) {
  const { x, y, radius } = PLANET;
  // Atmosphere halo.
  const halo = ctx.createRadialGradient(x, y, radius * 0.9, x, y, radius * 2.1);
  halo.addColorStop(0, 'rgba(87,182,255,0.30)');
  halo.addColorStop(1, 'rgba(87,182,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, radius * 2.1, 0, Math.PI * 2);
  ctx.fill();

  // Body: banded gas giant, bands clipped to the disc.
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();
  const body = ctx.createLinearGradient(x, y - radius, x, y + radius);
  body.addColorStop(0, '#7fd0ff');
  body.addColorStop(0.35, '#2f8fd6');
  body.addColorStop(0.62, '#1d6fb8');
  body.addColorStop(1, '#0d3f73');
  ctx.fillStyle = body;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#dff4ff';
  const bands = [-0.55, -0.22, 0.12, 0.44, 0.72];
  for (let i = 0; i < bands.length; i++) {
    const by = y + bands[i] * radius + Math.sin(world.time * 0.24 + i * 1.7) * 2.5;
    ctx.beginPath();
    ctx.ellipse(x, by, radius * 1.02, radius * 0.10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Terminator shadow for depth.
  const shade = ctx.createRadialGradient(x - radius * 0.45, y - radius * 0.4, radius * 0.2, x, y, radius * 1.25);
  shade.addColorStop(0, 'rgba(255,255,255,0.20)');
  shade.addColorStop(0.55, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(2,8,24,0.55)');
  ctx.fillStyle = shade;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();

  // Shield ring: bright while the shield holds, angry red as it fails.
  const frac = world.shield / (world.maxShield || PLANET.maxShield);
  ctx.strokeStyle = frac > 0.3 ? 'rgba(89,255,200,0.75)' : 'rgba(255,93,115,0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, PLANET.orbitRadius - 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(140,190,255,0.16)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, PLANET.orbitRadius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawGuardian(ctx, world, input) {
  const gx = PLANET.x + Math.cos(world.guardianAngle) * PLANET.orbitRadius;
  const gy = PLANET.y + Math.sin(world.guardianAngle) * PLANET.orbitRadius;
  const aim = Math.atan2(input.mouseY - gy, input.mouseX - gx);
  ctx.save();
  ctx.translate(gx, gy);
  // Engine glow.
  ctx.fillStyle = 'rgba(87,182,255,0.35)';
  ctx.beginPath();
  ctx.arc(0, 0, GUARDIAN.radius + 7 + Math.sin(world.time * 9) * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(aim);
  // Twin hull prongs around the cannon.
  ctx.fillStyle = '#dfeaff';
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-6, -7);
  ctx.lineTo(-11, -12);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-11, 12);
  ctx.lineTo(-6, 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#57b6ff';
  ctx.fillRect(4, -2.5, 15, 5);
  ctx.fillStyle = COLORS.bolt;
  ctx.beginPath();
  ctx.arc(2, 0, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEnemy(ctx, e, time) {
  ctx.save();
  ctx.translate(e.x, e.y);
  const flash = e.flash > 0.4;
  if (e.kind === 'asteroid') {
    ctx.rotate(e.rot);
    ctx.fillStyle = flash ? '#e8c39a' : '#9a6b4f';
    ctx.strokeStyle = '#5f4128';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = e.radius * (0.78 + 0.3 * Math.abs(Math.sin(e.seed + i * 2.3)));
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.arc(e.radius * 0.25, -e.radius * 0.2, e.radius * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'drone') {
    const a = Math.atan2(PLANET.y - e.y, PLANET.x - e.x);
    ctx.rotate(a);
    ctx.fillStyle = flash ? '#ffd3da' : '#ff5d73';
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(-9, -9);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-9, 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.arc(2, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'weaver') {
    const a = Math.atan2(PLANET.y - e.y, PLANET.x - e.x);
    ctx.rotate(a + Math.sin(time * 6 + e.wobble) * 0.3);
    ctx.fillStyle = flash ? '#e6dcff' : '#9d7bff';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-4, -11);
    ctx.lineTo(-11, -4);
    ctx.lineTo(-11, 4);
    ctx.lineTo(-4, 11);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#59ffc8';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  } else if (e.kind === 'carrier') {
    const a = Math.atan2(PLANET.y - e.y, PLANET.x - e.x);
    ctx.rotate(a);
    ctx.fillStyle = flash ? '#ffd9b0' : '#c7512f';
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(10, -16);
    ctx.lineTo(-18, -13);
    ctx.lineTo(-24, 0);
    ctx.lineTo(-18, 13);
    ctx.lineTo(10, 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffb347';
    for (const off of [-9, 0, 9]) {
      ctx.beginPath();
      ctx.arc(-2, off, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Carrier health bar.
    ctx.rotate(-a);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-24, -e.radius - 13, 48, 5);
    ctx.fillStyle = '#ffb347';
    ctx.fillRect(-24, -e.radius - 13, 48 * (e.hp / e.maxHp), 5);
  } else if (e.kind === 'boss') {
    // THE HOLLOW SUN: a black disc wearing a corona of embers, with one
    // burning eye that watches the planet. It pulses as it feeds.
    const pulse = 1 + Math.sin(time * 2.1 + e.wobble) * 0.05;
    const r = e.radius * pulse;
    const glow = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 2.3);
    glow.addColorStop(0, 'rgba(255,120,40,0.34)');
    glow.addColorStop(1, 'rgba(255,80,30,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.3, 0, Math.PI * 2);
    ctx.fill();
    // Corona spikes, turning slowly against the disc's own spin.
    ctx.strokeStyle = flash ? '#ffe9c9' : '#ff9e3d';
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const a = e.rot * 0.7 + (i / 12) * Math.PI * 2;
      const flicker = 1 + 0.22 * Math.sin(time * 5 + e.seed + i * 1.9);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.96, Math.sin(a) * r * 0.96);
      ctx.lineTo(Math.cos(a) * r * 1.3 * flicker, Math.sin(a) * r * 1.3 * flicker);
      ctx.stroke();
    }
    ctx.fillStyle = flash ? '#3a2a33' : '#07040c';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,158,61,0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // The eye: a burning slit aimed at Aegis. In the last 0.6 s before a
    // volley it flares wide and bright — the telegraph a Keeper learns to
    // read — and once the Sun is enraged it never fully dims again.
    const ea = Math.atan2(PLANET.y - e.y, PLANET.x - e.x);
    ctx.rotate(ea);
    const windup = e.emberTimer !== undefined && e.emberTimer < 0.6;
    const enraged = e.hp <= e.maxHp * 0.3;
    const eyeR = r * (windup ? 0.58 : enraged ? 0.48 : 0.42);
    const eg = ctx.createRadialGradient(r * 0.25, 0, 1, r * 0.25, 0, eyeR);
    eg.addColorStop(0, '#fff3c9');
    eg.addColorStop(0.4, windup || enraged ? '#ff7847' : '#ffb347');
    eg.addColorStop(1, 'rgba(255,110,40,0)');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(r * 0.25, 0, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(-ea);
    // Boss health sliver under the disc (the wide bar sits at the top).
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-r, r + 10, r * 2, 5);
    ctx.fillStyle = '#ff9e3d';
    ctx.fillRect(-r, r + 10, r * 2 * (e.hp / e.maxHp), 5);
  }
  ctx.restore();
}

function drawEmber(ctx, emb, time) {
  const pulse = 1 + Math.sin(time * 7 + emb.x * 0.05) * 0.18;
  ctx.save();
  ctx.translate(emb.x, emb.y);
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, emb.radius * 2.4 * pulse);
  g.addColorStop(0, 'rgba(255,220,150,0.95)');
  g.addColorStop(0.35, 'rgba(255,158,61,0.75)');
  g.addColorStop(1, 'rgba(255,110,40,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, emb.radius * 2.4 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c9';
  ctx.beginPath();
  ctx.arc(0, 0, emb.radius * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// While a Hollow Sun lives, its name and health own the top of the sky.
function drawBossBar(ctx, world) {
  const boss = world.enemies.find((e) => e.kind === 'boss');
  if (!boss) return;
  const w = 460;
  const x = (VIEW.w - w) / 2;
  const y = 18;
  ctx.fillStyle = 'rgba(10,6,16,0.72)';
  ctx.fillRect(x, y, w, 16);
  ctx.fillStyle = '#ff9e3d';
  ctx.fillRect(x, y, w * Math.max(0, boss.hp / boss.maxHp), 16);
  ctx.strokeStyle = 'rgba(255,158,61,0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, 16);
  ctx.fillStyle = COLORS.text;
  ctx.font = '700 13px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${bossOf(world.wave).name} — NIGHT ${world.wave}`, VIEW.w / 2, y + 32);
  ctx.textAlign = 'left';
}

function drawCore(ctx, c, time) {
  const pulse = 1 + Math.sin(time * 5) * 0.15;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.globalAlpha = Math.min(1, c.life);
  ctx.fillStyle = 'rgba(89,255,200,0.25)';
  ctx.beginPath();
  ctx.arc(0, 0, c.radius * 2 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(time * 2.2);
  ctx.fillStyle = '#59ffc8';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.moveTo(0, -c.radius * pulse);
    ctx.lineTo(c.radius * 0.32, 0);
    ctx.lineTo(0, c.radius * 0.32);
    ctx.lineTo(-c.radius * 0.32, 0);
  }
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function bar(ctx, x, y, w, h, frac, color, label) {
  ctx.fillStyle = 'rgba(10,20,40,0.72)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  ctx.strokeStyle = 'rgba(160,210,255,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = COLORS.text;
  ctx.font = '600 12px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 6, y + h - 4);
}

function drawHUD(ctx, world) {
  bar(ctx, 22, 20, 250, 18, world.shield / (world.maxShield || PLANET.maxShield), world.shield > 30 ? '#59ffc8' : '#ff5d73', `SHIELD ${Math.ceil(world.shield)}`);
  ctx.fillStyle = COLORS.text;
  ctx.font = '700 21px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`NIGHT ${Math.max(1, world.wave)}`, 22, 68);
  ctx.font = '600 15px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = COLORS.dim;
  ctx.fillText(`hostiles left ${world.enemies.length + world.spawnQueue.length}`, 22, 90);

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.text;
  ctx.font = '700 21px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`${world.score.toLocaleString('en-US')}`, VIEW.w - 22, 40);
  ctx.font = '600 15px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = COLORS.credit;
  ctx.fillText(`◈ ${world.credits} credits`, VIEW.w - 22, 64);
  ctx.fillStyle = world.novaCharges > 0 ? '#59ffc8' : COLORS.dim;
  ctx.fillText(`✦ nova × ${world.novaCharges}  [space]`, VIEW.w - 22, 86);
  if (world.blessings && world.blessings.length > 0) {
    const names = world.blessings.map((id) => (BLESSINGS.find((b) => b.id === id) || {}).name || id);
    ctx.font = '600 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffb347';
    ctx.fillText(`boons: ${names.join(' · ')}`, VIEW.w - 22, 108);
  }
  ctx.textAlign = 'left';
}

function panel(ctx, w, h) {
  const x = (VIEW.w - w) / 2;
  const y = (VIEW.h - h) / 2;
  ctx.fillStyle = 'rgba(5,12,28,0.86)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(96,178,255,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  return { x, y };
}

function drawTitle(ctx, world) {
  const { x } = panel(ctx, 660, 430);
  const cx = VIEW.w / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.text;
  ctx.font = '800 64px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('AEGIS ORBIT', cx, 238);
  ctx.fillStyle = '#59ffc8';
  ctx.font = '700 17px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('T H E   L A S T   K E E P E R', cx, 272);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '16px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Every star in the sky has gone out but one.', cx, 316);
  ctx.fillText('The Hollow — things that feed on light — fall toward it, night after night.', cx, 342);
  ctx.fillText('You are the Keeper of Aegis: not a soldier. The one who stayed.', cx, 368);
  ctx.fillStyle = '#cfe6ff';
  ctx.font = '15px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Aim with the mouse — your cannon rides the orbit ring. Hold click to fire.', cx, 410);
  ctx.fillText('Space fires a nova that clears the sky; shoot mint star cores to recharge it.', cx, 434);
  ctx.fillText('Between nights, spend salvage in the shipyard. A/D or ←/→ orbits by keyboard.', cx, 458);
  ctx.fillStyle = '#ffb347';
  ctx.fillText('Every fifth night, the Hollow Sun rises in person. Bring it down, and claim its boon.', cx, 482);
  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3.4);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#59ffc8';
  ctx.font = '700 24px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('CLICK TO TAKE THE WATCH', cx, 516);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  void x;
}

// Greedy word wrap for the story lines, measured against the live font.
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function drawShop(ctx, world, shopPrice) {
  const { x, y } = panel(ctx, 760, 486);
  const cx = VIEW.w / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.text;
  ctx.font = '800 30px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`NIGHT ${world.wave} HELD — ${nightOf(world.wave).name}`, cx, y + 52);
  ctx.fillStyle = COLORS.dim;
  ctx.font = 'italic 15px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`Keeper's log — “${world.logLine}”`, cx, y + 78);
  ctx.fillStyle = COLORS.credit;
  ctx.font = '600 18px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`◈ ${world.credits} salvage credits — press 1–5 to refit`, cx, y + 106);
  ctx.textAlign = 'left';
  SHOP.forEach((item, i) => {
    const rowY = y + 128 + i * 52;
    const isNova = item.id === 'nova';
    const lvl = isNova ? world.novaCharges : world.levels[item.id] || 0;
    const maxed = isNova ? world.novaCharges >= (world.novaMax || NOVA.maxCharges) : lvl >= item.max;
    const price = shopPrice(item);
    const afford = world.credits >= price && !maxed;
    ctx.fillStyle = 'rgba(16,32,58,0.9)';
    ctx.fillRect(x + 28, rowY, 704, 42);
    ctx.strokeStyle = afford ? 'rgba(89,255,200,0.5)' : 'rgba(120,150,190,0.25)';
    ctx.strokeRect(x + 28, rowY, 704, 42);
    ctx.fillStyle = COLORS.text;
    ctx.font = '700 17px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`${i + 1}  ${item.name}`, x + 44, rowY + 27);
    ctx.fillStyle = COLORS.dim;
    ctx.font = '15px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(item.desc, x + 268, rowY + 27);
    ctx.fillStyle = maxed ? COLORS.dim : afford ? COLORS.credit : '#ff8fa0';
    ctx.font = '700 16px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(maxed ? 'MAX' : `◈ ${price}`, x + 712, rowY + 27);
    ctx.fillStyle = COLORS.dim;
    ctx.font = '13px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(isNova ? `charges ${lvl}` : `mk ${lvl}`, x + 640, rowY + 27);
    ctx.textAlign = 'left';
  });
  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3.4);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#59ffc8';
  ctx.font = '700 21px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`PRESS ENTER — NIGHT ${world.wave + 1}`, cx, y + 446);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawBlessing(ctx, world) {
  const { x, y } = panel(ctx, 820, 420);
  const cx = VIEW.w / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffb347';
  ctx.font = '800 30px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('THE SUN FALLS', cx, y + 54);
  ctx.fillStyle = COLORS.dim;
  ctx.font = 'italic 15px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(BLESSING_INTRO, cx, y + 82);
  ctx.fillStyle = COLORS.text;
  ctx.font = '600 16px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Choose one boon — it stays with the Keeper for the whole watch. Press 1–3.', cx, y + 112);
  const choices = world.blessingChoices || [];
  choices.forEach((boon, i) => {
    const cardW = 248;
    const cardX = x + 24 + i * (cardW + 14);
    const cardY = y + 140;
    ctx.fillStyle = 'rgba(24,26,44,0.92)';
    ctx.fillRect(cardX, cardY, cardW, 168);
    ctx.strokeStyle = 'rgba(255,179,71,0.65)';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(cardX, cardY, cardW, 168);
    ctx.fillStyle = '#ffb347';
    ctx.font = '800 26px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`${i + 1}`, cardX + cardW / 2, cardY + 42);
    ctx.fillStyle = COLORS.text;
    ctx.font = '700 17px "Segoe UI", system-ui, sans-serif';
    wrapText(ctx, boon.name, cardW - 28).forEach((line, li) => {
      ctx.fillText(line, cardX + cardW / 2, cardY + 76 + li * 21);
    });
    ctx.fillStyle = COLORS.dim;
    ctx.font = '14px "Segoe UI", system-ui, sans-serif';
    wrapText(ctx, boon.desc, cardW - 30).forEach((line, li) => {
      ctx.fillText(line, cardX + cardW / 2, cardY + 122 + li * 19);
    });
  });
  ctx.fillStyle = COLORS.dim;
  ctx.font = 'italic 14px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`Keeper's log — “${world.logLine}”`, cx, y + 356);
  ctx.fillStyle = COLORS.credit;
  ctx.font = '600 15px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('The shipyard opens once the boon is claimed.', cx, y + 384);
  ctx.textAlign = 'left';
}

function drawOver(ctx, world) {
  panel(ctx, 600, 380);
  const cx = VIEW.w / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.danger;
  ctx.font = '800 46px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('THE LIGHT GOES OUT', cx, 246);
  ctx.fillStyle = COLORS.text;
  ctx.font = '600 20px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`The Keeper held ${world.finalWave} night${world.finalWave === 1 ? '' : 's'} · ${world.kills} kills`, cx, 292);
  ctx.fillStyle = COLORS.credit;
  ctx.font = '700 26px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`SCORE ${world.score.toLocaleString('en-US')}`, cx, 330);
  ctx.fillStyle = COLORS.dim;
  ctx.font = 'italic 15px "Segoe UI", system-ui, sans-serif';
  wrapText(ctx, world.epitaphLine, 520).forEach((line, i) => {
    ctx.fillText(line, cx, 368 + i * 22);
  });
  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3.4);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#59ffc8';
  ctx.font = '700 21px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('CLICK TO KEEP THE WATCH AGAIN', cx, 452);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export function render(ctx, world, input, shopPrice) {
  ctx.save();
  if (world.shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }
  drawBackground(ctx, world.time);
  // Nova range hint ring.
  ctx.strokeStyle = 'rgba(89,255,200,0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(PLANET.x, PLANET.y, NOVA.radius, 0, Math.PI * 2);
  ctx.stroke();

  drawPlanet(ctx, world);
  for (const c of world.cores) drawCore(ctx, c, world.time);
  for (const e of world.enemies) drawEnemy(ctx, e, world.time);
  for (const emb of world.embers || []) drawEmber(ctx, emb, world.time);

  // Bolts as glowing streaks.
  for (const b of world.bolts) {
    ctx.strokeStyle = COLORS.bolt;
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  if (world.phase !== 'over') drawGuardian(ctx, world, input);

  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.font = '700 15px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const f of world.floaters) {
    ctx.globalAlpha = Math.min(1, f.life * 1.6);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';

  if (world.flash > 0) {
    ctx.fillStyle = `rgba(190,240,255,${(world.flash * 0.5).toFixed(3)})`;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }
  ctx.restore();

  drawHUD(ctx, world);
  if (world.phase === 'playing') drawBossBar(ctx, world);
  if (world.messageTimer > 0 && world.phase === 'playing') {
    ctx.globalAlpha = Math.min(1, world.messageTimer);
    ctx.fillStyle = COLORS.text;
    ctx.font = '800 44px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.message, VIEW.w / 2, 120);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
  if (world.phase === 'title') drawTitle(ctx, world);
  else if (world.phase === 'blessing') drawBlessing(ctx, world);
  else if (world.phase === 'shop') drawShop(ctx, world, shopPrice);
  else if (world.phase === 'over') drawOver(ctx, world);
  if (world.paused && world.phase === 'playing') {
    ctx.fillStyle = 'rgba(4,8,20,0.55)';
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    ctx.fillStyle = COLORS.text;
    ctx.font = '800 40px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VIEW.w / 2, VIEW.h / 2);
    ctx.font = '600 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.dim;
    ctx.fillText('P or Esc to resume · A/D or ←/→ to orbit · M to mute', VIEW.w / 2, VIEW.h / 2 + 34);
    ctx.textAlign = 'left';
  }
}
