/**
 * mesh-wolk
 * ------------------------------------------------------------------------
 * Zachte, langzaam bewegende mesh-gradient met korrel, als achtergrond van een
 * element. Eigen WebGL2-fragmentshader, geen library. Vanilla ES-module,
 * 0 dependencies, SSR-veilig (raakt `window`/`document` pas aan in `init()`).
 *
 * Hoe het werkt: drie zachte kleurvlekken zweven over een achtergrondkleur; een
 * vloeiende ruisvervorming (domain warp) maakt de randen organisch en een
 * statische korrel per CSS-pixel zit vooral in de overgangen, zodat het op
 * papier lijkt in plaats van op een plastic verloop.
 *
 * Werkt altijd:
 *  - zonder WebGL2 (of bij contextverlies): CSS-radialen in dezelfde kleuren;
 *  - de WebGL-context wordt pas gemaakt als het element binnen 600 px van beeld komt;
 *  - het canvas blijft `visibility: hidden` tot de eerste frame getekend is;
 *  - pauze buiten beeld, bij een verborgen tab, bij `html[data-motion=paused]`
 *    of het event `beweging:pauze`; bij minder beweging één stilstaande frame;
 *  - devicePixelRatio begrensd (`maxDpr`), `alpha:false, antialias:false,
 *    powerPreference:"low-power"`;
 *  - `destroy()` geeft de GL-context terug (`WEBGL_lose_context`).
 *
 * Kleuren en getallen komen uit opties, anders uit CSS-variabelen op de root
 * (`--mw-achtergrond`, `--mw-kleur-1..3`, `--mw-speed`, …). Daardoor schakelt
 * een sectie met `data-theme="dark"` vanzelf naar de donkere variant.
 *
 * Herkomst: eu-hosted.com/nl (28-10-2026), wolken achter de stapkaarten. Eigen
 * shader; de instellingen (speed 1,2, scale 0,82–0,9, softness 0,82–0,86,
 * intensity 0,24–0,3, grain 0,09–0,1) zijn het vertrekpunt voor de presets.
 *
 * @typedef {Object} MeshWolkOpties
 * @property {'lucht'|'indigo'|'schemer'} [preset] Kleurset uit de CSS (ook via `data-mw-preset`).
 * @property {string} [achtergrond] Achtergrondkleur (elke CSS-kleur).
 * @property {string[]} [kleuren] Drie kleuren voor de vlekken.
 * @property {number} [speed=1.2] Tempo van de beweging.
 * @property {number} [scale=0.9] Grootte van de vlekken (hoger = groter).
 * @property {number} [softness=0.82] Zachtheid van de randen (0–1).
 * @property {number} [intensity=0.28] Hoeveel de ruis de vormen vervormt (0–1).
 * @property {number} [grain=0.1] Korrel (0–1).
 * @property {number} [rotation=8] Draaiing van het patroon in graden.
 * @property {number} [maxDpr=2] Bovengrens voor devicePixelRatio.
 *
 * @param {HTMLElement} root Element met `[data-mesh-wolk]`.
 * @param {MeshWolkOpties} [opties]
 * @returns {() => void} destroy — idempotent.
 */
import { vereisRoot, minderBeweging, inBeeld, zonderUndefined } from '../../_kwaliteit/basis.js';

const STANDAARD = { speed: 1.2, scale: 0.9, softness: 0.82, intensity: 0.28, grain: 0.1, rotation: 8, maxDpr: 2 };
const GETALLEN = ['speed', 'scale', 'softness', 'intensity', 'grain', 'rotation'];
const STIL_T = 7.5; // tijdstip voor de stilstaande frame (minder beweging): een rustige compositie

const VERTEX = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform float u_tijd, u_dpr, u_schaal, u_zacht, u_vervorm, u_korrel, u_draai;
uniform vec3 u_bg, u_k0, u_k1, u_k2;
out vec4 uit;

// Integer-hash: stabiel op elke GPU, geen sin()-precisieproblemen.
float hash(vec2 p) {
  uvec2 q = uvec2(ivec2(floor(p))) * uvec2(1597334677u, 3812015801u);
  uint n = (q.x ^ q.y) * 1597334677u;
  return float(n) * (1.0 / 4294967295.0);
}
float ruis(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) { v += a * ruis(p); p = m * p + 3.1; a *= 0.5; }
  return v;
}
float vlek(vec2 p, vec2 c, float r) { vec2 d = p - c; return exp(-dot(d, d) / (r * r)); }

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  float s = sin(u_draai), c = cos(u_draai);
  uv = mat2(c, -s, s, c) * uv / max(u_schaal, 0.05);
  float t = u_tijd * 0.12;

  vec2 w = vec2(fbm(uv * 1.25 + vec2(t, -0.7 * t)), fbm(uv * 1.25 + vec2(-0.8 * t, 0.9 * t) + 7.3)) - 0.5;
  vec2 p = uv + w * u_vervorm * 2.4;

  vec2 c0 = vec2(-0.48 + 0.22 * sin(t * 1.3), 0.20 + 0.16 * cos(t * 1.1));
  vec2 c1 = vec2(0.42 + 0.20 * cos(t * 0.9 + 1.7), -0.14 + 0.20 * sin(t * 1.2 + 0.4));
  vec2 c2 = vec2(0.04 + 0.30 * sin(t * 0.7 + 3.1), 0.46 + 0.14 * cos(t * 1.4 + 2.2));
  float g0 = vlek(p, c0, 0.62), g1 = vlek(p, c1, 0.56), g2 = vlek(p, c2, 0.70);

  // Korrel: statisch per CSS-pixel, het sterkst waar een vlek overgaat in de volgende.
  float n = hash(floor(gl_FragCoord.xy / max(u_dpr, 1.0))) - 0.5;
  float k = u_korrel * 3.0;
  float z = clamp(u_zacht, 0.05, 1.0);
  g0 = smoothstep(0.5 - 0.5 * z, 0.5 + 0.5 * z, g0 + n * k * g0 * (1.0 - g0) * 4.0);
  g1 = smoothstep(0.5 - 0.5 * z, 0.5 + 0.5 * z, g1 + n * k * g1 * (1.0 - g1) * 4.0);
  g2 = smoothstep(0.5 - 0.5 * z, 0.5 + 0.5 * z, g2 + n * k * g2 * (1.0 - g2) * 4.0);

  vec3 kleur = u_bg;
  kleur = mix(kleur, u_k2, g2);
  kleur = mix(kleur, u_k0, g0);
  kleur = mix(kleur, u_k1, g1);
  kleur += n * u_korrel * 0.05;
  uit = vec4(kleur, 1.0);
}`;

/** Pauzeknop van de site: `html[data-motion=paused]` of het event `beweging:pauze`. */
function luisterPauze(doc, onChange) {
  const html = doc.documentElement;
  let staat = html.getAttribute('data-motion') === 'paused';
  const zet = (v) => { if (v !== staat) { staat = v; onChange(v); } };
  const mo = new doc.defaultView.MutationObserver(() => zet(html.getAttribute('data-motion') === 'paused'));
  mo.observe(html, { attributes: true, attributeFilter: ['data-motion'] });
  const ev = (e) => zet(!!(e.detail && e.detail.gepauzeerd));
  doc.addEventListener('beweging:pauze', ev);
  return { get gepauzeerd() { return staat; }, stop() { mo.disconnect(); doc.removeEventListener('beweging:pauze', ev); } };
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'mesh-wolk')) return () => {};
  const o = { ...STANDAARD, ...zonderUndefined(opties) };
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const eigenPreset = o.preset && !root.hasAttribute('data-mw-preset');
  if (eigenPreset) root.setAttribute('data-mw-preset', o.preset);

  // CSS-kleur → [r, g, b] (0–1) via een 1×1 2D-canvas: werkt voor hex, rgb, oklch, color-mix.
  const proef = doc.createElement('canvas');
  proef.width = proef.height = 1;
  const pctx = proef.getContext('2d', { willReadFrequently: true });
  const rgb = (css, terug) => {
    if (!pctx || !css) return terug;
    pctx.clearRect(0, 0, 1, 1);
    pctx.fillStyle = '#000';
    pctx.fillStyle = css;
    pctx.fillRect(0, 0, 1, 1);
    const d = pctx.getImageData(0, 0, 1, 1).data;
    return [d[0] / 255, d[1] / 255, d[2] / 255];
  };
  function lees() {
    const cs = win.getComputedStyle(root);
    const v = (naam) => cs.getPropertyValue(naam).trim();
    const k = o.kleuren || [];
    const p = {
      bg: rgb(o.achtergrond || v('--mw-achtergrond'), [0.91, 0.96, 0.99]),
      k0: rgb(k[0] || v('--mw-kleur-1'), [0.75, 0.89, 0.97]),
      k1: rgb(k[1] || v('--mw-kleur-2'), [0.54, 0.8, 0.95]),
      k2: rgb(k[2] || v('--mw-kleur-3'), [0.86, 0.94, 0.98]),
    };
    for (const g of GETALLEN) {
      const css = parseFloat(v(`--mw-${g}`));
      p[g] = opties[g] !== undefined ? Number(opties[g]) : Number.isFinite(css) ? css : STANDAARD[g];
    }
    return p;
  }

  let p = lees();
  let gl = null; let prog = null; let buf = null; let loc = {};
  let canvas = null;
  let tijd = 0; let laatste = 0; let raf = 0; let getoond = false;
  let inZicht = false; let vernietigd = false;
  const stoppers = [];

  // minderBeweging() geeft de stand bij aanroep; de callback houdt `reduced` daarna live bij.
  let reduced = false;
  const mb = minderBeweging((r) => { reduced = r; if (r) tijd = STIL_T; bijwerken(); teken(); }, doc);
  reduced = mb.reduced;
  if (reduced) tijd = STIL_T;
  const pauze = luisterPauze(doc, () => bijwerken());
  stoppers.push(() => mb.stop(), () => pauze.stop());

  function zetStaat(s) { if (root.getAttribute('data-mw-staat') !== s) root.setAttribute('data-mw-staat', s); }

  function terugval() {
    root.setAttribute('data-mw-terugval', '');
    zetStaat('terugval');
  }

  function maakShader(type, bron) {
    const s = gl.createShader(type);
    gl.shaderSource(s, bron);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('mesh-wolk: shader compileert niet —', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  /** Programma, buffer en uniforms opzetten (ook na een herstelde context). */
  function zetOp() {
    const vs = maakShader(gl.VERTEX_SHADER, VERTEX);
    const fs = maakShader(gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return false;
    prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('mesh-wolk: programma linkt niet —', gl.getProgramInfoLog(prog));
      return false;
    }
    gl.useProgram(prog);
    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // één driehoek over het hele vlak
    const a = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['u_res', 'u_tijd', 'u_dpr', 'u_schaal', 'u_zacht', 'u_vervorm', 'u_korrel', 'u_draai', 'u_bg', 'u_k0', 'u_k1', 'u_k2']) {
      loc[n] = gl.getUniformLocation(prog, n);
    }
    zetUniforms();
    maat();
    return true;
  }

  function zetUniforms() {
    if (!gl || !prog) return;
    gl.uniform3fv(loc.u_bg, p.bg);
    gl.uniform3fv(loc.u_k0, p.k0);
    gl.uniform3fv(loc.u_k1, p.k1);
    gl.uniform3fv(loc.u_k2, p.k2);
    gl.uniform1f(loc.u_schaal, p.scale);
    gl.uniform1f(loc.u_zacht, p.softness);
    gl.uniform1f(loc.u_vervorm, p.intensity);
    gl.uniform1f(loc.u_korrel, p.grain);
    gl.uniform1f(loc.u_draai, (p.rotation * Math.PI) / 180);
  }

  function maat() {
    if (!gl || !canvas) return;
    const dpr = Math.min(win.devicePixelRatio || 1, Math.max(1, o.maxDpr));
    const w = Math.max(1, Math.round(root.clientWidth * dpr));
    const h = Math.max(1, Math.round(root.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(loc.u_res, w, h);
    gl.uniform1f(loc.u_dpr, dpr);
  }

  function teken() {
    if (!gl || !prog || gl.isContextLost() || !canvas.width) return;
    gl.uniform1f(loc.u_tijd, tijd);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!getoond) {
      getoond = true;
      canvas.style.visibility = 'visible';
      root.setAttribute('data-mw-getekend', '');
    }
  }

  function frame(nu) {
    raf = 0;
    const dt = Math.min(nu - laatste, 100) / 1000; // na een haperende tab niet springen
    laatste = nu;
    tijd += dt * p.speed;
    teken();
    raf = win.requestAnimationFrame(frame);
  }

  function bijwerken() {
    if (vernietigd) return;
    if (root.hasAttribute('data-mw-terugval')) return;
    const loopt = !!gl && inZicht && !reduced && !pauze.gepauzeerd && !doc.hidden;
    if (loopt && !raf) {
      laatste = win.performance.now();
      raf = win.requestAnimationFrame(frame);
    } else if (!loopt && raf) {
      win.cancelAnimationFrame(raf);
      raf = 0;
    }
    zetStaat(!gl ? 'wacht' : loopt ? 'loopt' : 'stil');
  }

  function maakContext() {
    if (gl || vernietigd) return;
    canvas = doc.createElement('canvas');
    canvas.className = 'mw-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.visibility = 'hidden';
    root.insertBefore(canvas, root.firstChild);
    gl = canvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'low-power', depth: false, stencil: false, premultipliedAlpha: false });
    if (!gl || !zetOp()) {
      canvas.remove();
      canvas = null;
      gl = null;
      terugval();
      return;
    }
    const kwijt = (e) => {
      e.preventDefault();
      if (raf) { win.cancelAnimationFrame(raf); raf = 0; }
      root.setAttribute('data-mw-terugval', '');
      zetStaat('terugval');
    };
    const terug = () => {
      root.removeAttribute('data-mw-terugval');
      loc = {};
      if (zetOp()) { teken(); bijwerken(); } else terugval();
    };
    canvas.addEventListener('webglcontextlost', kwijt);
    canvas.addEventListener('webglcontextrestored', terug);
    stoppers.push(() => {
      canvas.removeEventListener('webglcontextlost', kwijt);
      canvas.removeEventListener('webglcontextrestored', terug);
    });
    teken();
    bijwerken();
  }

  // Lui laden: context pas maken als het element binnen 600 px van beeld komt (R17).
  stoppers.push(inBeeld(root, maakContext, { rootMargin: '600px' }));
  // Lopen alleen als het echt in beeld is (R18).
  stoppers.push(inBeeld(root, () => { inZicht = true; bijwerken(); }, {
    once: false, bijUit: () => { inZicht = false; bijwerken(); },
  }));

  const opZicht = () => bijwerken();
  doc.addEventListener('visibilitychange', opZicht);
  stoppers.push(() => doc.removeEventListener('visibilitychange', opZicht));

  if ('ResizeObserver' in win) {
    const ro = new win.ResizeObserver(() => { maat(); teken(); });
    ro.observe(root);
    stoppers.push(() => ro.disconnect());
  }

  // Thema per sectie: kleuren opnieuw lezen als ergens data-theme wisselt.
  const thema = new win.MutationObserver(() => { p = lees(); zetUniforms(); teken(); });
  thema.observe(doc.documentElement, { attributes: true, subtree: true, attributeFilter: ['data-theme', 'data-mw-preset'] });
  stoppers.push(() => thema.disconnect());

  zetStaat(root.hasAttribute('data-mw-terugval') ? 'terugval' : 'wacht');

  return function destroy() {
    if (vernietigd) return;
    vernietigd = true;
    if (raf) win.cancelAnimationFrame(raf);
    raf = 0;
    for (const s of stoppers) s();
    if (gl) {
      if (!gl.isContextLost()) {
        gl.deleteBuffer(buf);
        gl.deleteProgram(prog);
      }
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
    gl = null;
    if (canvas) canvas.remove();
    canvas = null;
    for (const a of ['data-mw-staat', 'data-mw-terugval', 'data-mw-getekend']) root.removeAttribute(a);
    if (eigenPreset) root.removeAttribute('data-mw-preset');
  };
}
