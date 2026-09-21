(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const Flor = window.Flor;

  // ---- Fecha de inicio del contador (hora local de quien abre la página) ----
  const START = new Date(2025, 7, 7, 0, 0, 0); // 7 de agosto de 2025

  // Tiempo transcurrido en días totales, horas, minutos y segundos.
  function elapsed(from, to) {
    let rest = Math.max(0, to - from);
    const d = Math.floor(rest / 864e5); rest -= d * 864e5;
    const h = Math.floor(rest / 36e5);  rest -= h * 36e5;
    const mi = Math.floor(rest / 6e4);  rest -= mi * 6e4;
    return { d, h, mi, s: Math.floor(rest / 1000) };
  }

  const cache = {};
  function put(id, val) {
    if (cache[id] !== val) { cache[id] = val; $(id).textContent = val; }
  }
  const pad = (n) => String(n).padStart(2, '0');

  function tick() {
    const t = elapsed(START, new Date());
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
