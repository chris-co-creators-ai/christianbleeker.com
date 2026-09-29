// genereer-paden.mjs — rekent de veldlijnen en logoplekken vooraf uit en
// print de markup. Gebruik: node genereer-paden.mjs [aantalLogos=8]
// Plak de uitvoer in je template (of roep de exports aan in een build-stap).
import { pathToFileURL } from 'node:url';
import { OPZET, berekenLaag } from './krachtveld-logowand.js';

/** <svg> voor één laag ('d' = desktop, 'm' = mobiel). */
export function laagSvg(sleutel) {
  const l = berekenLaag(OPZET[sleutel]);
  const paden = l.paden
    .map((p) => `    <path data-kv-l="${p.L}" data-kv-kant="${p.kant}" style="--kv-i:${p.lijn}" pathLength="1" d="${p.d}"/>`)
    .join('\n');
  return `  <svg class="kv__veld kv__veld--${sleutel}" viewBox="${l.vb.join(' ')}" aria-hidden="true" focusable="false"\n`
    + `       data-kv-veld="${sleutel}" data-kv-r="${l.R}" data-kv-draai="${l.draai ? 1 : 0}">\n${paden}\n  </svg>`;
}

/** De inline stijl voor logo n (1-based): desktop- en mobiele plek in %. */
export function logoStijl(n) {
  const d = berekenLaag(OPZET.d).logos[n - 1];
  const m = berekenLaag(OPZET.m).logos[n - 1];
  return `--dx:${d.px};--dy:${d.py};--mx:${m.px};--my:${m.py};--kv-n:${n - 1}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const aantal = Math.min(10, Math.max(6, Number(process.argv[2]) || 8));
  console.log(laagSvg('d'));
  console.log(laagSvg('m'));
  for (let n = 1; n <= aantal; n++) console.log(`<li class="kv__logo" style="${logoStijl(n)}"><!-- logo ${n}: <img alt="…"> of inline <svg role="img" aria-label="…"> --></li>`);
}
