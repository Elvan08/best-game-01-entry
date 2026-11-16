// AEGIS ORBIT — tuning constants. Everything the game balances on lives here so
// the feel can be adjusted in one place: sizes, speeds, prices, wave shapes.

export const VIEW = { w: 1280, h: 720 };

// The planet sits at the centre of the view; the guardian rides a ring around it.
export const PLANET = {
  x: VIEW.w / 2,
  y: VIEW.h / 2,
  radius: 64,
  orbitRadius: 118,
  maxShield: 100,
};

export const GUARDIAN = {
  radius: 13,
  boltSpeed: 780,
  boltRadius: 4,
  boltLife: 1.15, // seconds a bolt flies before it burns out
  baseFireInterval: 0.21,
  baseDamage: 1,
};

export const NOVA = { radius: 560, startCharges: 1, maxCharges: 3 };

// Enemy kinds. hp in bolt hits, speed in px/s toward the planet, score/credits on kill.
export const ENEMIES = {
  asteroid: { radius: 17, hp: 2, speed: 34, score: 40, credits: 3, damage: 9 },
  drone: { radius: 12, hp: 1, speed: 62, score: 70, credits: 5, damage: 7 },
  weaver: { radius: 13, hp: 3, speed: 47, score: 120, credits: 8, damage: 11 },
  carrier: { radius: 26, hp: 9, speed: 22, score: 260, credits: 16, damage: 18 },
};

// Wave n (1-based) is built from these knobs; counts scale gently so a run
// lasts minutes, not seconds, and the shop between waves matters.
export function wavePlan(n) {
  return {
    asteroids: 4 + n * 2,
    drones: 2 + n * 2,
    weavers: n >= 2 ? n : 0,
    carriers: n >= 3 ? Math.floor((n - 1) / 2) : 0,
    spawnGap: Math.max(0.45, 1.15 - n * 0.07),
    speedScale: 1 + (n - 1) * 0.09,
  };
}

// The between-wave shop. Each item can be bought repeatedly; price grows per level.
export const SHOP = [
  { id: 'rapid', name: 'RAPID CYCLER', desc: 'Fire 18% faster', base: 45, growth: 1.55, max: 6 },
  { id: 'twin', name: 'TWIN CANNONS', desc: '+1 bolt per shot', base: 130, growth: 2.1, max: 3 },
  { id: 'regen', name: 'SHIELD WEAVE', desc: 'Shield regrows +0.55/s', base: 60, growth: 1.6, max: 5 },
  { id: 'over', name: 'OVERCHARGE', desc: 'Bolts deal +1 damage', base: 110, growth: 1.9, max: 4 },
  { id: 'nova', name: 'NOVA CHARGE', desc: '+1 nova blast (max 3)', base: 80, growth: 1.0, max: 99 },
];

export const COLORS = {
  ink: '#04060f',
  star: '#cfe6ff',
  planetCore: '#1d6fb8',
  planetGlow: '#57b6ff',
  shield: '#59ffc8',
  bolt: '#ffe066',
  credit: '#ffd166',
  danger: '#ff5d73',
  text: '#e8f3ff',
  dim: '#8fb4d9',
};
