/* Música: Canon en Re (Pachelbel, dominio público) tocado con un piano sintetizado
   con Web Audio. No usa archivos de audio: cada nota se genera en el navegador.

   Estructura: el bajo de 8 acordes (D A Bm F#m G D G A) se repite sin parar; sobre él,
   la mano izquierda hace arpegios suaves y la derecha toca el tema con variaciones
   cada vez más movidas (redondas -> negras -> corcheas) y vuelve a empezar. */
(function () {
  'use strict';

  const BPM = 84;               // un poco más animado que el Canon tradicional
  const BEAT = 60 / BPM;

  let ctx = null, master = null, dry = null, rev = null;
  let on = false, timer = null, cycle = 0, nextStart = 0;

  // ---------- Partitura ----------
  const SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function freq(name) {
    const m = /^([A-G]#?)(\d)$/.exec(name);
    const midi = SEMI[m[1]] + 12 * (Number(m[2]) + 1);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Cada acorde dura 2 tiempos. bass = nota grave; arp = notas del arpegio.
  const CHORDS = [
    { bass: 'D3',  arp: ['A3', 'D4', 'F#4'] },   // D
    { bass: 'A2',  arp: ['A3', 'C#4', 'E4'] },   // A
    { bass: 'B2',  arp: ['B3', 'D4', 'F#4'] },   // Bm
    { bass: 'F#2', arp: ['A3', 'C#4', 'F#4'] },  // F#m
    { bass: 'G2',  arp: ['B3', 'D4', 'G4'] },    // G
    { bass: 'D3',  arp: ['A3', 'D4', 'F#4'] },   // D
    { bass: 'G2',  arp: ['B3', 'D4', 'G4'] },    // G
    { bass: 'A2',  arp: ['A3', 'C#4', 'E4'] }    // A
  ];
  const ARP_PATTERN = [0, 1, 2, 1];   // 4 corcheas por acorde

  // Melodía por acorde: [tiempo dentro del acorde, nota]
  const half = (notes) => notes.map((n) => [[0, n]]);
  const MELODY = {
    // El tema de siempre, en blancas.
    theme: half(['F#5', 'E5', 'D5', 'C#5', 'B4', 'A4', 'B4', 'C#5']),
    // Segunda voz, una octava arriba: suena a cajita de música.
    high: half(['D6', 'C#6', 'B5', 'A5', 'G5', 'F#5', 'G5', 'E5']),
    // Negras.
    quarters: [['F#5', 'D5'], ['E5', 'C#5'], ['D5', 'B4'], ['C#5', 'A4'],
               ['B4', 'D5'], ['A4', 'D5'], ['B4', 'D5'], ['C#5', 'E5']]
      .map(([a, b]) => [[0, a], [1, b]]),
    // Corcheas: la parte más alegre.
    eighths: [['F#5', 'A5', 'F#5', 'D5'], ['E5', 'C#5', 'E5', 'A5'], ['D5', 'F#5', 'D5', 'B4'],
              ['C#5', 'A4', 'C#5', 'F#5'], ['B4', 'D5', 'G5', 'D5'], ['A4', 'D5', 'F#5', 'D5'],
              ['B4', 'D5', 'G5', 'D5'], ['C#5', 'E5', 'A5', 'E5']]
      .map((g) => g.map((n, i) => [i * .5, n]))
  };
  const ORDER = ['theme', 'high', 'quarters', 'eighths', 'quarters', 'high'];

  // ---------- Sonido ----------
  function reverb() {
    const len = ctx.sampleRate * 2.8;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
    }
    const conv = ctx.createConvolver();
    conv.buffer = buf;
    return conv;
  }

  function init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();   // evita saturación cuando suenan varias notas
    comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .3;
    master.connect(comp); comp.connect(ctx.destination);

    dry = ctx.createGain(); dry.gain.value = .78; dry.connect(master);
    rev = reverb();
    const revOut = ctx.createGain(); revOut.gain.value = .5;
    rev.connect(revOut); revOut.connect(master);
    nextStart = ctx.currentTime + .4;
    return true;
  }

  // Una nota de piano: parciales armónicos con decaimiento en dos etapas
  // (golpe de martillo + resonancia), más largo en graves y más corto en agudos.
  const PARTIALS = [1, .52, .3, .17, .09];
  function note(f, t, vel) {
    const n = f > 900 ? 3 : f > 400 ? 4 : 5;
    const ring = Math.max(1.5, Math.min(4.4, 5.2 - Math.log2(f / 110) * .95));
    const out = ctx.createGain();
    out.gain.value = vel * .3;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = .4;
    lp.frequency.value = Math.min(8000, 1200 + vel * 4200 + f * 1.5);
    out.connect(lp); lp.connect(dry); lp.connect(rev);

    for (let i = 0; i < n; i++) {
      const end = t + ring / (1 + i * .55);
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * (i + 1) * (1 + .0003 * i * i);   // ligera inarmonicidad, como cuerdas reales
      const g = ctx.createGain();
      g.gain.setValueAtTime(.0001, t);
      g.gain.linearRampToValueAtTime(PARTIALS[i], t + .006);
      g.gain.exponentialRampToValueAtTime(PARTIALS[i] * .5, t + .16);
      g.gain.exponentialRampToValueAtTime(.0005, end);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(end + .1);
    }
  }

  // Programa un ciclo completo (8 acordes = 16 tiempos) a partir de nextStart.
  function scheduleCycle() {
    const mel = MELODY[ORDER[cycle % ORDER.length]];
    const t0 = nextStart;
    const human = () => (Math.random() - .5) * .014;   // pequeñas imperfecciones de tiempo

    CHORDS.forEach((chord, i) => {
      const cb = t0 + i * 2 * BEAT;
      note(freq(chord.bass), cb, .5);
      ARP_PATTERN.forEach((k, j) => note(freq(chord.arp[k]), cb + j * .5 * BEAT + human(), j === 0 ? .36 : .3));
      mel[i].forEach(([off, n]) => note(freq(n), cb + off * BEAT + human(), .58 + Math.random() * .1));
    });

    nextStart = t0 + 16 * BEAT;
    cycle++;
  }

  // Mantiene siempre programados unos segundos por delante.
  function pump() {
    if (!ctx) return;
    while (nextStart - ctx.currentTime < 3) scheduleCycle();
  }

  function start() {
    if (!ctx && !init()) return;
    on = true;
    ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(.9, ctx.currentTime, .6);
    pump();
    if (!timer) timer = setInterval(pump, 500);
  }

  function stop() {
    if (!ctx) return;
    on = false;
    master.gain.setTargetAtTime(0, ctx.currentTime, .2);
    // Al pausar el reloj de audio, la música se reanuda exactamente donde quedó.
    setTimeout(() => { if (!on) ctx.suspend(); }, 900);
  }

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (on) ctx.resume();
  });

  window.Flor = window.Flor || {};
  window.Flor.audio = {
    start, stop,
    isOn: () => on,
    toggle() { on ? stop() : start(); return on; }
  };
})();
