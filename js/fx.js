/* Efectos en canvas: estrellas, luciérnagas doradas, pétalos que caen y destellos. */
(function () {
  'use strict';

  const canvas = document.getElementById('fx');
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);

  let W = 0, H = 0, dpr = 1;
  let stars = [], motes = [], petals = [], sparks = [];
  let petalsOn = false, running = false, last = 0;

  // Sprite de brillo pre-renderizado (mucho más barato que crear gradientes en cada frame).
  const glow = document.createElement('canvas');
  glow.width = glow.height = 64;
  (function () {
    const g = glow.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,244,190,1)');
    gr.addColorStop(.25, 'rgba(255,214,110,.75)');
    gr.addColorStop(1, 'rgba(255,190,80,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
  })();

  function makeMote(anywhere) {
    return {
      x: rand(0, W), y: anywhere ? rand(H * .15, H) : H + 20,
      r: rand(3, 9), vy: rand(6, 20), vx: rand(2, 8),
      amp: rand(10, 28), ph: rand(0, 6.28), sp: rand(.4, 1.1),
      tw: rand(.8, 2), a: rand(.35, .8)
    };
  }
  function makePetal(anywhere) {
    return {
      x: rand(0, W), y: anywhere ? rand(-H * .1, H * .8) : -20,
      s: rand(6, 11), vy: rand(16, 30), amp: rand(20, 45),
      ph: rand(0, 6.28), sp: rand(.5, 1), rot: rand(0, 6.28), vr: rand(-1, 1),
      flip: rand(0, 6.28), a: rand(.65, .95)
    };
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const small = W < 600;
    stars = Array.from({ length: small ? 34 : 60 }, () => ({
      x: rand(0, W), y: rand(0, H * .38), r: rand(.4, 1.1),
      tw: rand(.6, 2.2), ph: rand(0, 6.28)
    }));
    motes = Array.from({ length: small ? 22 : 40 }, () => makeMote(true));
    petals = Array.from({ length: small ? 5 : 8 }, () => makePetal(true));
    if (reduce) draw(0);
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(1, .5 + .5 * Math.abs(Math.cos(p.flip)));
    ctx.globalAlpha = p.a;
    ctx.fillStyle = '#ffd23f';
    const s = p.s;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * .75, -s * .4, s * .55, s * .6, 0, s);
    ctx.bezierCurveTo(-s * .55, s * .6, -s * .75, -s * .4, 0, -s);
    ctx.fill();
    ctx.restore();
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    // Estrellas tenues arriba, donde el cielo aún es oscuro.
    ctx.fillStyle = '#fff4dc';
    for (const s of stars) {
      const fade = 1 - s.y / (H * .38);
      ctx.globalAlpha = Math.max(0, fade) * (.25 + .35 * Math.sin(t * s.tw + s.ph));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 6.283);
      ctx.fill();
    }

    // Luciérnagas / polen dorado.
    ctx.globalCompositeOperation = 'lighter';
    for (const m of motes) {
      const x = m.x + Math.sin(t * m.sp + m.ph) * m.amp;
      ctx.globalAlpha = m.a * (.55 + .45 * Math.sin(t * m.tw + m.ph));
      ctx.drawImage(glow, x - m.r, m.y - m.r, m.r * 2, m.r * 2);
    }
    // Destellos de las ráfagas.
    for (const s of sparks) {
      ctx.globalAlpha = Math.max(0, s.life / s.max);
      ctx.drawImage(glow, s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';

    // Pétalos.
    if (petalsOn || reduce) for (const p of petals) drawPetal(p);
    ctx.globalAlpha = 1;
  }

  function update(dt, t) {
    for (const m of motes) {
      m.y -= m.vy * dt; m.x += m.vx * dt;
      if (m.y < -20 || m.x > W + 40) Object.assign(m, makeMote(false));
    }
    if (petalsOn) {
      for (const p of petals) {
        p.y += p.vy * dt;
        p.x += Math.sin(t * p.sp + p.ph) * p.amp * dt;
        p.rot += p.vr * dt; p.flip += dt * 1.6;
        if (p.y > H + 20) Object.assign(p, makePetal(false));
      }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 40 * dt; s.vx *= .985;
      s.life -= dt;
      if (s.life <= 0) sparks.splice(i, 1);
    }
  }

  function loop(now) {
    if (!running) return;
    const t = now / 1000;
    const dt = Math.min(.05, last ? t - last : 0);
    last = t;
    update(dt, t);
    draw(t);
    requestAnimationFrame(loop);
  }

  function start() {
    if (reduce || running) return;
    running = true; last = 0;
    requestAnimationFrame(loop);
  }

  function burst(x, y, n) {
    if (reduce) return;
    for (let i = 0; i < (n || 24); i++) {
      const a = rand(0, 6.283), v = rand(30, 150);
      sparks.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30,
        r: rand(4, 11), life: rand(.9, 1.9), max: 1.9
      });
    }
  }

  // Punto (relativo al lienzo) de un elemento del DOM, p. ej. el centro de la flor.
  function centerOf(el) {
    const c = canvas.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - c.left, y: r.top + r.height / 2 - c.top };
  }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) running = false; else start();
  });
  // Un toque en cualquier parte lanza destellos.
  window.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || !document.body.classList.contains('open')) return;
    const c = canvas.getBoundingClientRect();
    burst(e.clientX - c.left, e.clientY - c.top, 14);
  });

  resize();
  start();
  window.Flor = window.Flor || {};
  window.Flor.fx = {
    burst, centerOf, resize,
    startPetals() { petalsOn = true; }
  };
})();
