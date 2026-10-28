/**
 * veeg-rij
 * ------------------------------------------------------------------------
 * Lijstregel (vacature, dienst, artikel) waarover bij hover of focus een
 * kleurvlak van links veegt, terwijl de tekst 2em opschuift en van kleur
 * wisselt. Het effect is CSS (veeg-rij.css). `init()` is optioneel en doet
 * twee dingen: elementen die je selector vindt als regel markeren, en met
 * `richting: 'pointer'` het vlak laten binnenkomen en vertrekken aan de kant
 * waar de muis de regel raakt of verlaat.
 *
 * Herkomst: gedrag gezien op bureautandem.nl (vacaturelijst). Eigen code.
 *
 * @typedef {Object} VeegRijOptions
 * @property {string} [selector="[data-veeg]"] Regels binnen `root`. Gevonden elementen zonder `data-veeg` krijgen het attribuut (en verliezen het bij destroy).
 * @property {'links'|'pointer'} [richting="links"] 'links': het vlak veegt altijd van links. 'pointer': van de kant waar de muis binnenkomt, en terug naar de kant waar hij vertrekt. Alleen voor een fijne pointer; touch en toetsenbord blijven van links.
 *
 * @param {Element} root
 * @param {VeegRijOptions} [opties]
 * @returns {() => void} destroy, idempotent
 */
import { vereisRoot } from '../../_kwaliteit/basis.js';

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'veeg-rij')) return () => {};
  const { selector = '[data-veeg]', richting = 'links' } = opties;

  const toegevoegd = [];
  const regels = [...root.querySelectorAll(selector)];
  for (const r of regels) {
    if (!r.hasAttribute('data-veeg')) { r.setAttribute('data-veeg', ''); toegevoegd.push(r); }
  }

  const listeners = [];
  if (richting === 'pointer') {
    const kant = (e, r) => {
      const b = r.getBoundingClientRect();
      return e.clientX < b.left + b.width / 2 ? 'left' : 'right';
    };
    const zet = (r, k) => r.style.setProperty('--veeg-origin', k);
    for (const r of regels) {
      const enter = (e) => { if (e.pointerType === 'mouse') zet(r, kant(e, r)); };
      // vertrekt de muis rechts, dan trekt het vlak zich naar rechts terug
      const leave = (e) => { if (e.pointerType === 'mouse') zet(r, kant(e, r)); };
      r.addEventListener('pointerenter', enter, { passive: true });
      r.addEventListener('pointerleave', leave, { passive: true });
      listeners.push(() => {
        r.removeEventListener('pointerenter', enter);
        r.removeEventListener('pointerleave', leave);
        r.style.removeProperty('--veeg-origin');
      });
    }
  }

  let klaar = false;
  return function destroy() {
    if (klaar) return;
    klaar = true;
    for (const f of listeners) f();
    for (const r of toegevoegd) r.removeAttribute('data-veeg');
  };
}
