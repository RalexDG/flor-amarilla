/* Sonido ambiental suave, sintetizado con Web Audio (sin archivos de audio):
   un colchón de acordes, un viento leve y campanitas ocasionales. */
(function () {
  'use strict';

  let ctx = null, master = null, dry = null, rev = null;
  let on = false, chimeTimer = null;

  function reverb() {
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
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
    master.connect(ctx.destination);

    dry = ctx.createGain(); dry.gain.value = .8; dry.connect(master);
    rev = reverb();
    const revOut = ctx.createGain(); revOut.gain.value = .6;
    rev.connect(revOut); revOut.connect(master);

    // Colchón de acordes (Re mayor con novena), con leve vaivén de volumen.
    const pad = ctx.createGain(); pad.gain.value = .9;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 780; lp.Q.value = .3;
    pad.connect(lp); lp.connect(dry); lp.connect(rev);
    [146.83, 220, 293.66, 369.99, 554.37].forEach((freq, i) => {
      [-5, 5].forEach((det) => {
        const o = ctx.createOscillator();
        o.type = i % 2 ? 'sine' : 'triangle';
        o.frequency.value = freq; o.detune.value = det;
        const g = ctx.createGain(); g.gain.value = .03;
        const lfo = ctx.createOscillator(); lfo.frequency.value = .04 + Math.random() * .08;
        const lg = ctx.createGain(); lg.gain.value = .018;
        lfo.connect(lg); lg.connect(g.gain);
        o.connect(g); g.connect(pad);
        o.start(); lfo.start();
      });
    });

    // Viento suave (ruido browniano filtrado con volumen ondulante).
    const nb = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const nd = nb.getChannelData(0);
    let prev = 0;
    for (let i = 0; i < nd.length; i++) { prev = (prev + .02 * (Math.random() * 2 - 1)) / 1.02; nd[i] = prev * 3.5; }
    const ns = ctx.createBufferSource(); ns.buffer = nb; ns.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 480; bp.Q.value = .5;
    const wg = ctx.createGain(); wg.gain.value = .08;
    const wl = ctx.createOscillator(); wl.frequency.value = .07;
    const wlg = ctx.createGain(); wlg.gain.value = .05;
    wl.connect(wlg); wlg.connect(wg.gain);
    ns.connect(bp); bp.connect(wg); wg.connect(dry); wg.connect(rev);
    ns.start(); wl.start();
    return true;
  }

  const NOTES = [587.33, 659.25, 739.99, 880, 987.77, 1174.66]; // pentatónica de Re

  function chime() {
    if (!on) return;
    const t = ctx.currentTime + .05;
    const freq = NOTES[Math.floor(Math.random() * NOTES.length)];
    [[1, .07], [2.01, .018]].forEach(([mul, vol]) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq * mul;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + .01);
      g.gain.exponentialRampToValueAtTime(.0001, t + 4.5);
      o.connect(g); g.connect(rev); g.connect(dry);
      o.start(t); o.stop(t + 5);
    });
    chimeTimer = setTimeout(chime, 3500 + Math.random() * 6000);
  }

  function start() {
    if (!ctx && !init()) return;
    on = true;
    ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(.9, ctx.currentTime, 1.4);
    clearTimeout(chimeTimer);
    chimeTimer = setTimeout(chime, 1500);
  }

  function stop() {
    if (!ctx) return;
    on = false;
    clearTimeout(chimeTimer);
    master.gain.setTargetAtTime(0, ctx.currentTime, .25);
    setTimeout(() => { if (!on) ctx.suspend(); }, 1200);
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
