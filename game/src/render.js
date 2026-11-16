// AEGIS ORBIT — rendering. Pure canvas 2D: a banded gas-giant planet with a
// glowing atmosphere, a parallax starfield, polygon ships and rocks, and a
// HUD that reads at a glance. Screens (title, shop, game over) draw here too.

import { VIEW, PLANET, GUARDIAN, NOVA, SHOP, COLORS } from './config.js';
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
  const frac = world.shield / PLANET.maxShield;
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
  }
  ctx.restore();
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
  bar(ctx, 22, 20, 250, 18, world.shield / PLANET.maxShield, world.shield > 30 ? '#59ffc8' : '#ff5d73', `SHIELD ${Math.ceil(world.shield)}`);
  ctx.fillStyle = COLORS.text;
  ctx.font = '700 21px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`WAVE ${Math.max(1, world.wave)}`, 22, 68);
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
  const { x } = panel(ctx, 620, 400);
  const cx = VIEW.w / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.text;
  ctx.font = '800 64px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('AEGIS ORBIT', cx, 268);
  ctx.fillStyle = '#57b6ff';
  ctx.font = '600 19px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('one guardian · one planet · no second chances', cx, 304);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '16px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Aim with the mouse — your guardian rides the orbit ring.', cx, 356);
  ctx.fillText('Hold click to fire. Space fires a nova that clears the sky.', cx, 382);
  ctx.fillText('Shoot mint star cores to recharge the nova.', cx, 408);
  ctx.fillText('Between waves, spend salvage credits in the shipyard.', cx, 434);
  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3.4);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#59ffc8';
  ctx.font = '700 24px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('CLICK TO DEFEND', cx, 492);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  void x;
}

function drawShop(ctx, world, shopPrice) {
  const { x, y } = panel(ctx, 760, 470);
  const cx = VIEW.w / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.text;
  ctx.font = '800 34px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`WAVE ${world.wave} HELD`, cx, y + 58);
  ctx.fillStyle = COLORS.credit;
  ctx.font = '600 18px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`◈ ${world.credits} salvage credits — press 1–5 to refit`, cx, y + 88);
  ctx.textAlign = 'left';
  SHOP.forEach((item, i) => {
    const rowY = y + 122 + i * 52;
    const isNova = item.id === 'nova';
    const lvl = isNova ? world.novaCharges : world.levels[item.id] || 0;
    const maxed = isNova ? world.novaCharges >= NOVA.maxCharges : lvl >= item.max;
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
  ctx.fillText(`PRESS ENTER — WAVE ${world.wave + 1}`, cx, y + 428);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawOver(ctx, world) {
  panel(ctx, 560, 330);
  const cx = VIEW.w / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.danger;
  ctx.font = '800 46px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('AEGIS HAS FALLEN', cx, 268);
  ctx.fillStyle = COLORS.text;
  ctx.font = '600 20px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`You held ${world.finalWave} wave${world.finalWave === 1 ? '' : 's'} · ${world.kills} kills`, cx, 322);
  ctx.fillStyle = COLORS.credit;
  ctx.font = '700 26px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`SCORE ${world.score.toLocaleString('en-US')}`, cx, 362);
  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3.4);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#59ffc8';
  ctx.font = '700 21px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('CLICK TO TRY AGAIN', cx, 428);
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
    ctx.fillText('P to resume · A/D or ←/→ to orbit · M to mute', VIEW.w / 2, VIEW.h / 2 + 34);
    ctx.textAlign = 'left';
  }
}
