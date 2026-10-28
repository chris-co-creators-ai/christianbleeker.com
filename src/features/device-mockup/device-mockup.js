/**
 * portfolio/device-mockup
 * ------------------------------------------------------------------------
 * Laptop- en telefoonframes in pure CSS (geen framebeeld, alleen vormen/
 * schaduwen) met een screenshot erin. Is de screenshot langer dan het
 * schermvlak (een volledige paginascreenshot), dan scrollt hij zachtjes
 * mee bij hover/focus — CSS regelt de transitie en de reduced-motion-
 * uitzondering zelf, deze module berekent alleen hoe ver en hoe lang
 * (afhankelijk van de echte beeldverhouding, dat kan CSS niet). Vanilla
 * ES-module, 0 dependencies, SSR-veilig: raakt window/document pas aan
 * binnen init().
 *
 * @typedef {Object} DeviceMockupOptions
 * @property {string} [selector="[data-device]"] CSS-selector voor de toestel-frames binnen `root`.
 *
 * @param {Element} root Container met één of meer `[data-device]`-frames.
 * @param {DeviceMockupOptions} [options]
 * @returns {() => void} destroy — verwijdert listeners en de berekende CSS-variabelen. Idempotent.
 */
import { isTouch, vereisRoot } from '../../_kwaliteit/basis.js';

export function init(root, options = {}) {
  if (!vereisRoot(root, 'device-mockup')) return () => {};

  const { selector = '[data-device]' } = options;
  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const touch = isTouch(doc);

  // `root` mag zelf al een `[data-device]`-frame zijn (React-wrapper: één
  // instantie per component) óf een container met meerdere frames erin
  // (vanilla: één init() voor een hele galerij) — beide werken.
  const rootIsDevice = typeof root.matches === 'function' && root.matches(selector);
  const devices = rootIsDevice ? [root] : Array.from(root.querySelectorAll(selector));
  if (devices.length === 0) {
    if (typeof console !== 'undefined') console.warn('device-mockup: geen elementen gevonden voor ' + selector);
    return () => {};
  }

  let destroyed = false;
  const cleanups = [];

  devices.forEach((device) => {
    const frame = device.querySelector('[data-device-screen]')?.closest('.dm-frame') || device.querySelector('.dm-frame');
    const screen = device.querySelector('[data-device-screen]');
    const img = screen ? screen.querySelector('img') : null;
    if (!screen || !img) return;

    // Hoever moet de screenshot omhoogschuiven om zijn onderkant te tonen?
    // Dat hangt af van de echte beeldverhouding van de aangeleverde
    // afbeelding t.o.v. het schermvlak — dat kan CSS niet zelf uitrekenen.
    function measure() {
      const w = screen.clientWidth;
      if (!w || !img.naturalWidth || !img.naturalHeight) return;
      const renderedHeight = img.naturalHeight * (w / img.naturalWidth);
      const overflow = Math.max(0, renderedHeight - screen.clientHeight);
      screen.style.setProperty('--dm-scroll-distance', overflow > 0 ? `-${overflow}px` : '0px');
      const pxPerSecond = 70; // rustig leestempo, ongeacht de lengte van de screenshot
      const duration = Math.min(16, Math.max(2.5, overflow / pxPerSecond));
      screen.style.setProperty('--dm-duration', `${duration.toFixed(2)}s`);
    }

    if (img.complete && img.naturalWidth > 0) measure();
    else img.addEventListener('load', measure, { once: true });
    cleanups.push(() => img.removeEventListener('load', measure));

    win.addEventListener('resize', measure);
    cleanups.push(() => win.removeEventListener('resize', measure));

    // Touch heeft geen hover — een tik op het frame zet/haalt de actieve
    // stand (R3: het muis-alternatief blijft ook op touch bereikbaar).
    if (touch && frame) {
      const onTap = (e) => {
        e.preventDefault();
        device.classList.toggle('dm-is-active');
      };
      frame.addEventListener('pointerup', onTap);
      cleanups.push(() => frame.removeEventListener('pointerup', onTap));
    }
  });

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    cleanups.forEach((fn) => fn());
    devices.forEach((device) => {
      device.classList.remove('dm-is-active');
      const screen = device.querySelector('[data-device-screen]');
      if (screen) {
        screen.style.removeProperty('--dm-scroll-distance');
        screen.style.removeProperty('--dm-duration');
      }
    });
  };
}
