/* Construye la flor como SVG (sin imágenes).
   Tipos: 'T' = tulipán, 'G' = girasol. Se elige en js/config.js. */
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

  // Punto de una curva de Bézier cúbica (para colocar las hojas sobre el tallo).
  function bez(P, t) {
    const u = 1 - t;
    return [
      u*u*u*P[0][0] + 3*u*u*t*P[1][0] + 3*u*t*t*P[2][0] + t*t*t*P[3][0],
      u*u*u*P[0][1] + 3*u*u*t*P[1][1] + 3*u*t*t*P[2][1] + t*t*t*P[3][1]
    ];
  }

  // Degradados compartidos (tallo, hojas, halo de luz).
  const COMMON_DEFS =
    `<linearGradient id="stemG" x1="0" y1="1" x2="0" y2="0">
       <stop offset="0" stop-color="#3b6528"/><stop offset="1" stop-color="#86ad52"/>
     </linearGradient>
     <linearGradient id="leafG" x1="0" y1="1" x2="1" y2="0">
       <stop offset="0" stop-color="#3f7029"/><stop offset="1" stop-color="#9cc65f"/>
     </linearGradient>
     <radialGradient id="glowG">
       <stop offset="0" stop-color="#ffe68a" stop-opacity=".75"/>
       <stop offset=".45" stop-color="#ffc94d" stop-opacity=".28"/>
       <stop offset="1" stop-color="#ffb347" stop-opacity="0"/>
     </radialGradient>`;

  /* =====================================================================
     GIRASOL  ('G')
     ===================================================================== */
  function sunPetalPath(L, wl, wr) {
    return `M0,0 C${f(-wl)},${f(-L * .22)} ${f(-wl * 1.08)},${f(-L * .68)} 0,${f(-L)} ` +
           `C${f(wr * 1.08)},${f(-L * .68)} ${f(wr)},${f(-L * .22)} 0,0Z`;
  }

  function sunPetalRing(rand, count, baseL, baseW, offsetDeg, fill, delay0, step) {
    let out = '';
    for (let i = 0; i < count; i++) {
      const a = offsetDeg + (i * 360) / count + (rand() - .5) * 5;
      const L = baseL + (rand() - .5) * baseL * .1;
      const w = baseW + (rand() - .5) * 4;
      const wl = w * (.9 + rand() * .2), wr = w * (.9 + rand() * .2);
      const d = (delay0 + i * step).toFixed(2);
      out +=
        `<g transform="rotate(${f(a)})"><g class="petal" style="--d:${d}s">` +
          `<path d="${sunPetalPath(L, wl, wr)}" fill="${fill}" stroke="rgba(150,80,0,.25)" stroke-width=".8"/>` +
          `<path d="${sunPetalPath(L * .9, wl * .38, wr * .38)}" fill="#fff8c8" opacity=".2"/>` +
          `<path d="M0,-16 L${f((rand() - .5) * 2)},${f(-L * .8)}" stroke="rgba(140,70,0,.3)" stroke-width=".9" fill="none" stroke-linecap="round"/>` +
        `</g></g>`;
    }
    return out;
  }

  // Semillas del centro en espiral áurea (patrón de girasol).
  function sunSeeds() {
    const golden = Math.PI * (3 - Math.sqrt(5));
    let out = '';
    for (let i = 1; i <= 170; i++) {
      const r = 3.3 * Math.sqrt(i), a = i * golden;
      const light = i % 2 === 0;
      out += `<circle cx="${f(r * Math.cos(a))}" cy="${f(r * Math.sin(a))}" r="${f(1.1 + r * .022)}" ` +
             `fill="${light ? '#f4be48' : '#26120a'}" opacity="${light ? .5 : .55}"/>`;
    }
    return out;
  }

  const SUN_P = [[200, 640], [188, 520], [216, 380], [200, 200]];
  const SUN_LEAF = 'M0,0 C26,-36 88,-40 128,-6 C92,26 32,32 0,0Z';
  const SUN_LEAF_VEIN = 'M6,0 C42,-8 84,-10 122,-6';
  function sunLeaf(t, angle, flip, cls, delay) {
    const [x, y] = bez(SUN_P, t);
    return `<g transform="translate(${f(x)},${f(y)}) rotate(${angle}) scale(${flip},1)">` +
      `<g class="grow" style="--d:${delay}s"><g class="leaf ${cls}">` +
        `<path d="${SUN_LEAF}" fill="url(#leafG)" stroke="rgba(30,70,20,.35)" stroke-width=".8"/>` +
        `<path d="${SUN_LEAF_VEIN}" stroke="rgba(230,255,190,.4)" stroke-width="1.2" fill="none" stroke-linecap="round"/>` +
      `</g></g></g>`;
  }

  function sunflower() {
    const rand = rng(11);
    return `<defs>${COMMON_DEFS}
        <linearGradient id="pgB" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-150">
          <stop offset="0" stop-color="#d47c00"/><stop offset=".5" stop-color="#f6aa0a"/><stop offset="1" stop-color="#ffd24a"/>
        </linearGradient>
        <linearGradient id="pgF" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-135">
          <stop offset="0" stop-color="#ee9c00"/><stop offset=".45" stop-color="#ffc626"/><stop offset="1" stop-color="#fff29e"/>
        </linearGradient>
        <radialGradient id="ctrG" cx=".5" cy=".5" r=".62" fx=".38" fy=".32">
          <stop offset="0" stop-color="#b3720f"/><stop offset=".55" stop-color="#5e3305"/><stop offset="1" stop-color="#2a1305"/>
        </radialGradient>
        <radialGradient id="domeG" cx=".35" cy=".28" r=".7">
          <stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <g class="plant">
        <path class="stem" pathLength="1" fill="none" stroke="url(#stemG)" stroke-width="9" stroke-linecap="round"
              d="M${SUN_P[0]} C${SUN_P[1]} ${SUN_P[2]} ${SUN_P[3]}"/>
        ${sunLeaf(.30, 20, -1, 'l1', 1.5)}
        ${sunLeaf(.52, -24, 1, 'l2', 1.8)}
        <g transform="translate(200,200)">
          <circle class="glow" r="235" fill="url(#glowG)"/>
          <g class="head">
            ${sunPetalRing(rand, 17, 150, 26, 0, 'url(#pgB)', 2.35, .05)}
            ${sunPetalRing(rand, 15, 132, 25, 360 / 30, 'url(#pgF)', 3.05, .05)}
            <g class="center">
              <circle r="46" fill="url(#ctrG)"/>
              <circle r="46" fill="none" stroke="rgba(255,190,70,.45)" stroke-width="1.5"/>
              ${sunSeeds()}
              <circle r="46" fill="url(#domeG)"/>
            </g>
          </g>
        </g>
      </g>`;
  }

  /* =====================================================================
     TULIPÁN  ('T')  — tonos amarillos
     ===================================================================== */
  // Pétalo apuntando hacia arriba desde (0,0): largo L, semiancho W, punta curvada "bend".
  function tulipPetalPath(L, W, bend) {
    return `M0,0 C${f(-W)},${f(-L * .14)} ${f(-W * 1.12)},${f(-L * .66)} ${f(-W * .3 + bend)},${f(-L * .96)} ` +
           `Q${f(bend)},${f(-L * 1.04)} ${f(W * .3 + bend)},${f(-L * .96)} ` +
           `C${f(W * 1.12)},${f(-L * .66)} ${f(W)},${f(-L * .14)} 0,0Z`;
  }

  // Un pétalo completo, con sombreado para dar volumen:
  //  - cast: proyecta una sombra suave sobre los pétalos que tiene detrás
  //  - occ:  se oscurece hacia la base (queda tapado por los pétalos delanteros)
  function tulipPetal(angle, L, W, bend, fill, delay, shiftX, opts) {
    const o = opts || {};
    const d = tulipPetalPath(L, W, bend);
    const veins =
      `M0,-14 Q${f(bend * .5)},${f(-L * .5)} ${f(bend * .9)},${f(-L * .9)} ` +
      `M${f(-W * .42)},-18 Q${f(-W * .58 + bend * .4)},${f(-L * .5)} ${f(-W * .12 + bend * .8)},${f(-L * .86)} ` +
      `M${f(W * .42)},-18 Q${f(W * .58 + bend * .4)},${f(-L * .5)} ${f(W * .12 + bend * .8)},${f(-L * .86)}`;
    // Sombra proyectada: trazos anchos y muy transparentes apilados imitan un desenfoque sin usar filtros.
    const cast = o.cast
      ? [[12, .03], [7, .045], [3.5, .07]].map(([w, a]) =>
          `<path d="${d}" fill="none" stroke="#5a2400" stroke-opacity="${a}" stroke-width="${w}" stroke-linejoin="round"/>`).join('')
      : '';
    return `<g transform="translate(${shiftX || 0},0)">` +
      `<g class="tp" style="--a:${angle}deg;--d:${delay}s">` +
        cast +
        `<path d="${d}" fill="${fill}" stroke="rgba(160,90,0,.3)" stroke-width="1"/>` +
        `<path d="${d}" fill="url(#tS)"/>` +
        (o.occ ? `<path d="${d}" fill="url(#tOcc)"/>` : '') +
        `<path d="${tulipPetalPath(L * .84, W * .42, bend * .6)}" fill="#fff8cc" opacity=".3" transform="translate(${f(bend * .08)},-8)"/>` +
        `<path d="${d}" fill="url(#tSide)"/>` +
        `<path d="${veins}" fill="none" stroke="rgba(150,80,0,.22)" stroke-width="1" stroke-linecap="round"/>` +
      `</g></g>`;
  }

  const TUL_P = [[200, 640], [190, 540], [211, 420], [200, 300]];
  // Hoja larga y arqueada que sale desde la base del tallo.
  const TUL_LEAF = 'M0,0 C34,-60 70,-170 92,-268 C30,-190 -8,-80 0,0Z';
  const TUL_LEAF_VEIN = 'M3,-6 C32,-92 62,-190 88,-260';
  // Mitad de la hoja a un lado del nervio central: da el efecto de hoja doblada.
  const TUL_LEAF_SHADE = 'M0,0 C34,-60 70,-170 92,-268 L88,-260 C62,-190 32,-92 3,-6 Z';
  function tulipLeaf(t, angle, flip, size, cls, delay) {
    const [x, y] = bez(TUL_P, t);
    return `<g transform="translate(${f(x)},${f(y)}) rotate(${angle}) scale(${f(flip * size)},${f(size)})">` +
      `<g class="grow" style="--d:${delay}s"><g class="leaf ${cls}">` +
        `<path d="${TUL_LEAF}" fill="url(#leafG)" stroke="rgba(30,70,20,.35)" stroke-width="1"/>` +
        `<path d="${TUL_LEAF_SHADE}" fill="rgba(12,50,8,.3)"/>` +
        `<path d="${TUL_LEAF_VEIN}" stroke="rgba(230,255,190,.4)" stroke-width="1.4" fill="none" stroke-linecap="round"/>` +
      `</g></g></g>`;
  }

  function tulip() {
    // Tramo alto del tallo (donde cae la sombra de la flor), siguiendo su curva.
    const stemTop = [.78, .84, .9, .95, 1].map((t, i) => {
      const [x, y] = bez(TUL_P, t);
      return (i ? 'L' : 'M') + f(x) + ',' + f(y);
    }).join(' ');
    return `<defs>${COMMON_DEFS}
        <linearGradient id="tB" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-180">
          <stop offset="0" stop-color="#cf8300"/><stop offset=".5" stop-color="#efae14"/><stop offset="1" stop-color="#ffd24d"/>
        </linearGradient>
        <linearGradient id="tC" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-206">
          <stop offset="0" stop-color="#e59700"/><stop offset=".45" stop-color="#ffc62e"/><stop offset="1" stop-color="#fff0a0"/>
        </linearGradient>
        <linearGradient id="tF" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-192">
          <stop offset="0" stop-color="#f0a300"/><stop offset=".38" stop-color="#ffc722"/>
          <stop offset=".82" stop-color="#ffe57c"/><stop offset="1" stop-color="#fff5b8"/>
        </linearGradient>
        <linearGradient id="tS" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-120">
          <stop offset="0" stop-color="#8a3c00" stop-opacity=".4"/><stop offset="1" stop-color="#8a3c00" stop-opacity="0"/>
        </linearGradient>
        <!-- Volumen curvo: sombra a la izquierda, luz cálida del sol a la derecha -->
        <linearGradient id="tSide" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#6e2a00" stop-opacity=".5"/>
          <stop offset=".28" stop-color="#6e2a00" stop-opacity=".14"/>
          <stop offset=".55" stop-color="#fff6c0" stop-opacity=".14"/>
          <stop offset=".86" stop-color="#fffbd6" stop-opacity=".32"/>
          <stop offset="1" stop-color="#ffe9a0" stop-opacity=".08"/>
        </linearGradient>
        <!-- Oclusión: más oscuro hacia la base, donde los pétalos se tapan entre sí -->
        <radialGradient id="tOcc" cx=".5" cy="1" r=".78">
          <stop offset="0" stop-color="#5c2200" stop-opacity=".6"/>
          <stop offset=".6" stop-color="#5c2200" stop-opacity=".2"/>
          <stop offset="1" stop-color="#5c2200" stop-opacity="0"/>
        </radialGradient>
        <!-- Sombra de la flor sobre la parte alta del tallo -->
        <linearGradient id="tStemSh" gradientUnits="userSpaceOnUse" x1="0" y1="300" x2="0" y2="372">
          <stop offset="0" stop-color="#173010" stop-opacity=".7"/><stop offset="1" stop-color="#173010" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <g class="plant">
        <path class="stem" pathLength="1" fill="none" stroke="url(#stemG)" stroke-width="10" stroke-linecap="round"
              d="M${TUL_P[0]} C${TUL_P[1]} ${TUL_P[2]} ${TUL_P[3]}"/>
        ${tulipLeaf(.06, -10, -1, .92, 'l1', 1.5)}
        ${tulipLeaf(.10, 7, 1, 1, 'l2', 1.8)}
        <path class="stem-shade" fill="none" stroke="url(#tStemSh)" stroke-width="10" d="${stemTop}"/>
        <g transform="translate(200,300)">
          <circle class="glow" cy="-100" r="205" fill="url(#glowG)"/>
          <g class="head">
            ${tulipPetal(-27, 178, 50, 24, 'url(#tB)', 2.3, 0, { occ: true })}
            ${tulipPetal(27, 178, 50, -24, 'url(#tB)', 2.5, 0, { occ: true })}
            ${tulipPetal(0, 206, 56, 0, 'url(#tC)', 2.7, 0, { occ: true, cast: true })}
            ${tulipPetal(-9, 192, 50, 18, 'url(#tF)', 3.0, -25, { cast: true })}
            ${tulipPetal(9, 192, 50, -18, 'url(#tF)', 3.2, 25, { cast: true })}
          </g>
        </g>
      </g>`;
  }

  function build(svg, type) {
    type = String(type || 'T').toUpperCase() === 'G' ? 'G' : 'T';
    svg.innerHTML = type === 'G' ? sunflower() : tulip();
    document.body.setAttribute('data-flower', type);
    return type;
  }

  window.Flor = window.Flor || {};
  window.Flor.flower = { build };
})();
