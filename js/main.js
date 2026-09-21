(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const Flor = window.Flor;

  // ---- Contador ----
  // Inicio: 7 de agosto de 2025, 00:00 hora de Panamá (UTC-5), igual para todos los dispositivos.
  const START = new Date('2025-08-07T00:00:00-05:00').getTime();

  // Todo el tiempo transcurrido (años y meses incluidos) expresado en días,
  // más las horas, minutos y segundos sobrantes.
  function elapsed(now) {
    let rest = Math.max(0, now - START);
    const d = Math.floor(rest / 864e5); rest -= d * 864e5;
    const h = Math.floor(rest / 36e5);  rest -= h * 36e5;
    const mi = Math.floor(rest / 6e4);  rest -= mi * 6e4;
    return { d, h, mi, s: Math.floor(rest / 1000) };
  }

  const cache = {};
  function put(id, val) {
    const el = $(id);
    if (el && cache[id] !== val) { cache[id] = val; el.textContent = val; }
  }
  const pad = (n) => String(n).padStart(2, '0');

  function tick() {
    const t = elapsed(Date.now());
    put('t-d', t.d);  put('l-d', t.d === 1 ? 'día' : 'días');
    put('t-h', pad(t.h)); put('t-mi', pad(t.mi)); put('t-s', pad(t.s));
  }

  // El contador arranca primero: no depende de que lo demás cargue bien.
  tick();
  setInterval(tick, 1000);
  document.addEventListener('visibilitychange', tick); // al volver a la pestaña, se pone al día al instante

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
})();
