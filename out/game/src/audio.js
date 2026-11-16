// Procedural WebAudio sound: no audio files, every effect is a tiny synth
// blip shaped by hand. The context is created lazily on the first user
// gesture so browsers do not block it, and M toggles mute.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freqA, freqB, seconds, type, volume, delay = 0) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqA, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(24, freqB), t0 + seconds);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  function noise(seconds, volume, delay = 0) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + delay;
    const len = Math.max(1, Math.floor(ac.sampleRate * seconds));
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(t0);
  }

  return {
    unlock: ensure,
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    shoot() {
      tone(880, 220, 0.09, 'square', 0.05);
    },
    hit() {
      tone(300, 140, 0.06, 'triangle', 0.07);
    },
    boom(big = false) {
      noise(big ? 0.5 : 0.28, big ? 0.30 : 0.18);
      tone(big ? 120 : 160, 40, big ? 0.45 : 0.25, 'sine', 0.22);
    },
    planetHit() {
      tone(90, 45, 0.35, 'sawtooth', 0.20);
      noise(0.3, 0.16);
    },
    pickup() {
      tone(660, 990, 0.10, 'sine', 0.09);
      tone(990, 1320, 0.12, 'sine', 0.07, 0.07);
    },
    nova() {
      tone(180, 1400, 0.5, 'sawtooth', 0.12);
      noise(0.55, 0.22, 0.05);
    },
    waveStart() {
      tone(392, 392, 0.10, 'square', 0.07);
      tone(523, 523, 0.10, 'square', 0.07, 0.11);
      tone(659, 659, 0.16, 'square', 0.08, 0.22);
    },
    buy() {
      tone(523, 784, 0.09, 'triangle', 0.10);
      tone(784, 1046, 0.12, 'triangle', 0.09, 0.08);
    },
    denied() {
      tone(196, 147, 0.14, 'square', 0.08);
    },
    gameOver() {
      tone(440, 110, 0.9, 'triangle', 0.16);
      noise(0.8, 0.14, 0.1);
    },
  };
}
