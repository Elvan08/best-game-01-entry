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
// lasts minutes, not seconds, and the shop between waves matters. Every
// fifth night is a boss night: the queue shrinks to a trickle, because the
// night belongs to the Hollow Sun.
export function wavePlan(n) {
  if (isBossNight(n)) {
    return { asteroids: 3, drones: 2, weavers: 0, carriers: 0, spawnGap: 1.6, speedScale: 1 + (n - 1) * 0.09 };
  }
  return {
    asteroids: 4 + n * 2,
    drones: 2 + n * 2,
    weavers: n >= 2 ? n : 0,
    carriers: n >= 3 ? Math.floor((n - 1) / 2) : 0,
    spawnGap: Math.max(0.45, 1.15 - n * 0.07),
    speedScale: 1 + (n - 1) * 0.09,
  };
}

// THE HOLLOW SUN — every fifth night something vast rises to drink the
// light in person. It does not crash into Aegis like the small Hollow: it
// holds its distance, circles, sheds drones and weavers from its dark, and
// spits embers at the shield — embers the Keeper can shoot down. Kill it
// and the night pays out like no other; then the Keeper claims one boon
// from what the Sun carried before the shipyard opens.
export const BOSS = {
  every: 5,
  radius: 46,
  baseHp: 55,
  hpPerCycle: 45, // cycle 1 = night 5, cycle 2 = night 10, ...
  approachSpeed: 46,
  orbitSpeed: 17, // tangential drift while it holds its standoff
  standoff: 330, // px from the planet's centre where it circles
  minionInterval: 4.2,
  minionCap: 8, // live hostiles, boss included, before it stops shedding
  emberInterval: 3.4,
  emberSpeed: 118,
  emberDamage: 4,
  emberScore: 10, // shooting an ember down
  scorePerCycle: 1500,
  creditsPerCycle: 120,
};

export function isBossNight(n) {
  return n > 0 && n % BOSS.every === 0;
}

export function bossCycle(n) {
  return Math.max(1, Math.round(n / BOSS.every));
}

// The Sun wears a new name each time it returns, and the log answers it.
const BOSS_NIGHTS = [
  { name: 'THE HOLLOW SUN', log: 'It did not fall like the others. It rose — a sun that eats suns. I aimed into its dark and did not look away.' },
  { name: 'THE SUN-EATER RETURNS', log: 'It learned my orbit last time. I learned its hunger. We are even, and it knows it.' },
  { name: 'THE DARK BETWEEN STARS', log: 'There is always a bigger dark coming. There is only ever one Keeper. Hold.' },
];

export function bossOf(n) {
  return BOSS_NIGHTS[Math.min(bossCycle(n) - 1, BOSS_NIGHTS.length - 1)];
}

// THE KEEPER'S BOONS — when a Hollow Sun falls, the Keeper claims one of
// three boons drawn from this pool. Boons are permanent for the run and
// stack with the shipyard refits; they are the run's long arc, the reason
// to hunt the fifth night instead of merely surviving it.
export const BLESSINGS = [
  { id: 'emberheart', name: 'EMBER HEART', desc: 'Max shield +30, and mend 30 now' },
  { id: 'starforge', name: 'STARFORGE ROUNDS', desc: 'Every bolt deals +1 damage' },
  { id: 'pace', name: "KEEPER'S PACE", desc: 'Fire 15% faster, for good' },
  { id: 'seconddawn', name: 'SECOND DAWN', desc: '+1 nova charge, and novas hold +1 more' },
  { id: 'coremagnet', name: 'CORE MAGNET', desc: 'Star cores drop twice as often' },
];

export const BLESSING_INTRO = 'The Sun falls. What it carried, the Keeper may claim — once.';

// THE LAST KEEPER — the story frame. Every other star has gone out; Aegis is
// the last lit world, and the Hollow — things that feed on light — fall toward
// it night after night. The guardian is its Keeper: not a soldier, the one who
// stayed. Waves are NIGHTS; each has a name and a line in the Keeper's log,
// read in the shipyard while the sky is quiet. Past the written nights the
// log keeps counting, because the Keeper does.
export const STORY = {
  keeper: 'THE LAST KEEPER',
  star: 'AEGIS, THE LAST LIT STAR',
  nights: [
    { name: 'FIRST EMBERS', log: 'They came as sparks first. I almost thanked them for the light.' },
    { name: 'THE DIMMING', log: 'The dark learned my orbit tonight. It will not unlearn it.' },
    { name: 'WHAT THE ROCKS REMEMBER', log: 'The stones carry old fire in them. Even the Hollow was warm, once.' },
    { name: 'A CHOIR OF STATIC', log: 'The weavers sing through the black. I hum back so the star hears a voice.' },
    { name: 'THE GLOAM CARRIERS', log: 'They send their cathedrals now — slow, patient, full of teeth.' },
    { name: 'HALF-LIGHT', log: 'Half the sky is theirs. The half above Aegis is mine.' },
    { name: 'THE LONG ANSWER', log: 'Every bolt I fire is a sentence: not tonight. Not this star.' },
    { name: 'EMBERWEATHER', log: 'The cores drift like seed. Even dying, this orbit grows light.' },
    { name: 'THE HOLLOW, CLOSE', log: 'I can see them looking back now. Good. Let them aim at me.' },
    { name: 'TEN THOUSAND DAWNS', log: 'No dawn is coming. I keep the watch anyway. That is the whole of it.' },
  ],
  // For nights past the written ten, the log still speaks.
  lateLog: [
    'Night uncounted. The star still burns. So do I.',
    'The Hollow keeps the appointment. So does the Keeper.',
    'I stopped counting nights. I did not stop keeping them.',
  ],
  // The closing line when the shield fails, by how long the light was held.
  epitaph: (nights) =>
    nights <= 2
      ? 'The light went out early — but it was lit, and it was kept.'
      : nights <= 5
        ? 'Aegis dims. Somewhere in the dark, its embers are still travelling.'
        : 'The last star falls having been defended to the end. That is not nothing. That is everything.',
};

export function nightOf(n) {
  const s = STORY.nights[n - 1];
  if (s) return s;
  return { name: `NIGHT ${n}`, log: STORY.lateLog[(n - 1) % STORY.lateLog.length] };
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
