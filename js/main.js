(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const Flor = window.Flor;

  // ---- Fecha de inicio del contador (hora local de quien abre la página) ----
  const START = new Date(2025, 7, 7, 0, 0, 0); // 7 de agosto de 2025

  function elapsed(from, to) {
    let y = to.getFullYear() - from.getFullYear();
    let cur = new Date(from); cur.setFullYear(from.getFullYear() + y);
    if (cur > to) { y--; cur = new Date(from); cur.setFullYear(from.getFullYear() + y); }
    let m = (to.getFullYear() - cur.getFullYear()) * 12 + to.getMonth() - cur.getMonth();
    let c2 = new Date(cur); c2.setMonth(cur.getMonth() + m);
    if (c2 > to) { m--; c2 = new Date(cur); c2.setMonth(cur.getMonth() + m); }
    let rest = Math.max(0, to - c2);
    const d = Math.floor(rest / 864e5); rest -= d * 864e5;
    const h = Math.floor(rest / 36e5);  rest -= h * 36e5;
    const mi = Math.floor(rest / 6e4);  rest -= mi * 6e4;
    return { y, m, d, h, mi, s: Math.floor(rest / 1000) };
  }

  const cache = {};
  function put(id, val) {
    if (cache[id] !== val) { cache[id] = val; $(id).textContent = val; }
  }
  const pad = (n) => String(n).padStart(2, '0');

  function tick() {
    const t = elapsed(START, new Date());
    put('t-y', t.y);  put('l-y', t.y === 1 ? 'año' : 'años');
    put('t-mo', t.m); put('l-mo', t.m === 1 ? 'mes' : 'meses');
    put('t-d', t.d);  put('l-d', t.d === 1 ? 'día' : 'días');
    put('t-h', pad(t.h)); put('t-mi', pad(t.mi)); put('t-s', pad(t.s));
  }

  // ---- Flor ----
  Flor.flower.build($('flower'));

  // ---- Apertura ----
  const intro = $('intro');
  const soundBtn = $('sound');
  let opened = false;

  function setSoundUI() {
    const on = Flor.audio.isOn();
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.setAttribute('aria-label', on ? 'Silenciar sonido' : 'Activar sonido');
  }

  function open(withSound) {
    if (opened) return;
    opened = true;
    document.body.classList.add('open');
    intro.classList.add('hide');
    setTimeout(() => intro.remove(), 1600);

    soundBtn.hidden = false;
    if (withSound) Flor.audio.start();
    setSoundUI();

    // Destello cuando termina de florecer.
    setTimeout(() => {
      const c = Flor.fx.centerOf(document.querySelector('#flower .center'));
      Flor.fx.burst(c.x, c.y, 36);
      Flor.fx.startPetals();
    }, 4300);
  }

  $('open').addEventListener('click', () => open(true));
  soundBtn.addEventListener('click', () => { Flor.audio.toggle(); setSoundUI(); });

  // ?skip abre directo (útil para probar el diseño sin la bienvenida).
  if (/[?&]skip\b/.test(location.search)) open(false);

  tick();
  setInterval(tick, 1000);
})();
