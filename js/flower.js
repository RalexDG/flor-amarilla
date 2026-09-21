/* Construye la flor amarilla como SVG (sin imágenes). */
(function () {
  'use strict';

  // Generador pseudoaleatorio con semilla: la flor siempre se ve igual.
  function rng(seed) {
    return function () {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }
  const f = (n) => n.toFixed(2);

  // Pétalo apuntando hacia arriba desde (0,0): largo L, semianchos wl / wr.
  function petalPath(L, wl, wr) {
    return `M0,0 C${f(-wl)},${f(-L * .22)} ${f(-wl * 1.08)},${f(-L * .68)} 0,${f(-L)} ` +
           `C${f(wr * 1.08)},${f(-L * .68)} ${f(wr)},${f(-L * .22)} 0,0Z`;
  }

  function petalRing(rand, count, baseL, baseW, offsetDeg, fill, delay0, step) {
    let out = '';
    for (let i = 0; i < count; i++) {
      const a = offsetDeg + (i * 360) / count + (rand() - .5) * 5;
      const L = baseL + (rand() - .5) * baseL * .1;
      const w = baseW + (rand() - .5) * 4;
      const wl = w * (.9 + rand() * .2), wr = w * (.9 + rand() * .2);
      const d = (delay0 + i * step).toFixed(2);
      out +=
        `<g transform="rotate(${f(a)})"><g class="petal" style="--d:${d}s">` +
          `<path d="${petalPath(L, wl, wr)}" fill="${fill}" stroke="rgba(150,80,0,.25)" stroke-width=".8"/>` +
          `<path d="${petalPath(L * .9, wl * .38, wr * .38)}" fill="#fff8c8" opacity=".2"/>` +
          `<path d="M0,-16 L${f((rand() - .5) * 2)},${f(-L * .8)}" stroke="rgba(140,70,0,.3)" stroke-width=".9" fill="none" stroke-linecap="round"/>` +
        `</g></g>`;
    }
    return out;
  }

  // Semillas del centro en espiral áurea (patrón de girasol).
  function seeds() {
    const golden = Math.PI * (3 - Math.sqrt(5));
    let out = '';
    const n = 170;
    for (let i = 1; i <= n; i++) {
      const r = 3.3 * Math.sqrt(i), a = i * golden;
      const x = r * Math.cos(a), y = r * Math.sin(a);
      const light = i % 2 === 0;
      out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.1 + r * .022)}" ` +
             `fill="${light ? '#f4be48' : '#26120a'}" opacity="${light ? .5 : .55}"/>`;
    }
    return out;
  }

  // Punto y ángulo del tallo (curva de Bézier cúbica) para colocar las hojas.
  const P = [[200, 640], [188, 520], [216, 380], [200, 200]];
  function bez(t) {
    const u = 1 - t;
    const x = u*u*u*P[0][0] + 3*u*u*t*P[1][0] + 3*u*t*t*P[2][0] + t*t*t*P[3][0];
    const y = u*u*u*P[0][1] + 3*u*u*t*P[1][1] + 3*u*t*t*P[2][1] + t*t*t*P[3][1];
    return [x, y];
  }
  const LEAF = 'M0,0 C26,-36 88,-40 128,-6 C92,26 32,32 0,0Z';
  const LEAF_VEIN = 'M6,0 C42,-8 84,-10 122,-6';
  function leaf(t, angle, flip, cls, delay) {
    const [x, y] = bez(t);
    return `<g transform="translate(${f(x)},${f(y)}) rotate(${angle}) scale(${flip},1)">` +
      `<g class="grow" style="--d:${delay}s"><g class="leaf ${cls}">` +
        `<path d="${LEAF}" fill="url(#leafG)" stroke="rgba(30,70,20,.35)" stroke-width=".8"/>` +
        `<path d="${LEAF_VEIN}" stroke="rgba(230,255,190,.4)" stroke-width="1.2" fill="none" stroke-linecap="round"/>` +
      `</g></g></g>`;
  }

  function build(svg) {
    const rand = rng(11);
    svg.innerHTML =
      `<defs>
        <linearGradient id="pgB" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-150">
          <stop offset="0" stop-color="#d47c00"/><stop offset=".5" stop-color="#f6aa0a"/><stop offset="1" stop-color="#ffd24a"/>
        </linearGradient>
        <linearGradient id="pgF" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-135">
          <stop offset="0" stop-color="#ee9c00"/><stop offset=".45" stop-color="#ffc626"/><stop offset="1" stop-color="#fff29e"/>
        </linearGradient>
        <linearGradient id="stemG" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#3b6528"/><stop offset="1" stop-color="#86ad52"/>
        </linearGradient>
        <linearGradient id="leafG" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="#3f7029"/><stop offset="1" stop-color="#9cc65f"/>
        </linearGradient>
        <radialGradient id="ctrG" cx=".5" cy=".5" r=".62" fx=".38" fy=".32">
          <stop offset="0" stop-color="#b3720f"/><stop offset=".55" stop-color="#5e3305"/><stop offset="1" stop-color="#2a1305"/>
        </radialGradient>
        <radialGradient id="glowG">
          <stop offset="0" stop-color="#ffe68a" stop-opacity=".75"/>
          <stop offset=".45" stop-color="#ffc94d" stop-opacity=".28"/>
          <stop offset="1" stop-color="#ffb347" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="domeG" cx=".35" cy=".28" r=".7">
          <stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <g class="plant">
        <path class="stem" pathLength="1" fill="none" stroke="url(#stemG)" stroke-width="9" stroke-linecap="round"
              d="M${P[0]} C${P[1]} ${P[2]} ${P[3]}"/>
        ${leaf(.30, 20, -1, 'l1', 1.5)}
        ${leaf(.52, -24, 1, 'l2', 1.8)}
        <g transform="translate(200,200)">
          <circle class="glow" r="235" fill="url(#glowG)"/>
          <g class="head">
            ${petalRing(rand, 17, 150, 26, 0, 'url(#pgB)', 2.35, .05)}
            ${petalRing(rand, 15, 132, 25, 360 / 30, 'url(#pgF)', 3.05, .05)}
            <g class="center">
              <circle r="46" fill="url(#ctrG)"/>
              <circle r="46" fill="none" stroke="rgba(255,190,70,.45)" stroke-width="1.5"/>
              ${seeds()}
              <circle r="46" fill="url(#domeG)"/>
            </g>
          </g>
        </g>
      </g>`;
  }

  window.Flor = window.Flor || {};
  window.Flor.flower = { build };
})();
