/**
 * tools/chatgpt-intake-knop
 * ------------------------------------------------------------------------
 * Knop of pil die ChatGPT of Claude opent met een kant-en-klare intakeprompt,
 * met placeholders ({{bedrijf}}, {{site}}) die de bouwer via data-attributen
 * vult. De prompt komt uit een los bestand (`data-prompt-src`, fetch) of uit
 * een inline template (optie `promptTemplate`).
 *
 * Anders dan een kale link meet deze module de lengte van de opgebouwde URL:
 * blijft die onder de drempel (standaard 8.000 tekens), dan is de trigger
 * gewoon een `<a target="_blank" rel="noopener">` met de prompt in de
 * querystring. Komt hij erboven — zoals bij een lange, uitgebreide intake —
 * dan wordt het een twee-staps-flow: de volledige prompt gaat naar het
 * klembord (Clipboard API, met een `<textarea>` + `execCommand('copy')` als
 * terugval) en de link zelf opent de chatassistent met een korte "plak de
 * prompt"-instructie. Zonder JavaScript is de trigger een gewone link naar
 * het promptbestand zelf om te kopiëren. Vanilla ES-module, 0 dependencies,
 * SSR-veilig: raakt window/document pas aan binnen `init()`.
 *
 * Herkomst: idee gezien op christianbleeker.com (research/christianbleeker/
 * OVERZICHT.md, feature C1) — een pil in de navigatie opent ChatGPT met een
 * kant-en-klare intakeprompt. Hun link is 28.700 tekens lang; browsers en
 * proxies kunnen zulke lange URL's afkappen (ONGETEST bij hen, zie
 * OVERZICHT.md "Waar het rammelt"). Eigen implementatie, geen code
 * overgenomen: wij meten de lengte en vallen automatisch terug op de
 * klembord-flow.
 *
 * @typedef {Object} ChatgptIntakeKnopOptions
 * @property {string} [selector="[data-cik-trigger]"] CSS-selector voor de triggers binnen `root`.
 * @property {string} [promptTemplate] Inline prompt-tekst; wint als hij is gezet, anders wordt `data-prompt-src` gefetcht.
 * @property {{bedrijf?: string, site?: string}} [placeholders] Standaardwaarden; een `data-bedrijf`/`data-site` op de trigger zelf wint.
 * @property {number} [drempel=8000] Vanaf hoeveel tekens URL-lengte de klembord-flow gebruikt wordt.
 *
 * @param {Element} root Container waarbinnen naar triggers gezocht wordt.
 * @param {ChatgptIntakeKnopOptions} [opties]
 * @returns {() => void} destroy — herstelt elke trigger naar de oorspronkelijke (no-JS) link. Idempotent.
 */
import { vereisRoot } from '../../_kwaliteit/basis.js';

const BASIS_URL = {
  chatgpt: (tekst) => `https://chatgpt.com/?prompt=${encodeURIComponent(tekst)}`,
  claude: (tekst) => `https://claude.ai/new?q=${encodeURIComponent(tekst)}`,
};

const NAAM = { chatgpt: 'ChatGPT', claude: 'Claude' };

const KORTE_INSTRUCTIE =
  'Plak hieronder de intakeprompt die zojuist naar je klembord is gekopieerd en start daarmee het gesprek.';

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'chatgpt-intake-knop')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const {
    selector = '[data-cik-trigger]',
    promptTemplate = null,
    placeholders = {},
    drempel = 8000,
  } = opties;

  const triggers = Array.from(root.querySelectorAll(selector));
  if (triggers.length === 0) {
    if (typeof console !== 'undefined') {
      console.warn(`chatgpt-intake-knop: geen triggers gevonden voor ${selector}`);
    }
    return () => {};
  }

  let destroyed = false;
  const cleanups = triggers.map((trigger) => setupTrigger(trigger));

  function setupTrigger(trigger) {
    let cancelled = false;
    const target = trigger.getAttribute('data-target') === 'claude' ? 'claude' : 'chatgpt';
    const eigenDrempel = Number(trigger.getAttribute('data-drempel')) || drempel;
    const bouwUrl = BASIS_URL[target];
    const waarden = {
      bedrijf: trigger.getAttribute('data-bedrijf') || placeholders.bedrijf || '',
      site: trigger.getAttribute('data-site') || placeholders.site || '',
    };

    // Oorspronkelijke staat bewaren zodat destroy() de no-JS-link teruggeeft.
    const oorspronkelijk = {
      href: trigger.getAttribute('href'),
      target: trigger.getAttribute('target'),
      rel: trigger.getAttribute('rel'),
      ariaLabel: trigger.getAttribute('aria-label'),
      parent: trigger.parentNode,
      volgende: trigger.nextSibling,
    };

    trigger.target = '_blank';
    trigger.rel = 'noopener';
    const zichtbareTekst = trigger.textContent.trim();
    trigger.setAttribute('aria-label', `${zichtbareTekst} (opent in nieuw tabblad)`);

    // G1-fix: de trigger in een eigen positioneringsanker verpakken, zodat de
    // feedback-tooltip straks absoluut t.o.v. dít element kan (en dus nooit
    // meer meetelt als flex-/grid-item van de omringende layout — dat was
    // precies waarom de pil 544px opschoof in de nav-flexbox).
    const wrap = doc.createElement('span');
    wrap.className = 'cik__wrap';
    oorspronkelijk.parent.insertBefore(wrap, trigger);
    wrap.appendChild(trigger);

    const feedback = doc.createElement('span');
    feedback.className = 'cik__feedback';
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    wrap.appendChild(feedback);

    let promptTekst = '';

    function verwerk(ruweTekst) {
      if (cancelled) return;
      // N1-fix (beta-herronde 25-09): een leidend HTML-commentaarblok in het
      // promptbestand (documentatie voor wie het bestand rechtstreeks leest,
      // zie intake-prompt.md) hoort NOOIT in de prompt naar ChatGPT/Claude
      // terecht te komen. Strippen vóór placeholders vervangen worden, zodat
      // er geen tijd verspild wordt aan tekst die toch weggaat.
      const zonderUitleg = stripLeidendCommentaar(ruweTekst);
      promptTekst = vervangPlaceholders(zonderUitleg, waarden);
      const url = bouwUrl(promptTekst);
      if (url.length > eigenDrempel) {
        // G2-fix: href blijft het echte promptbestand (dezelfde link als
        // zonder JS) — nooit de "…is zojuist naar je klembord gekopieerd"-
        // instructie-URL vóórdat er ook daadwerkelijk gekopieerd is. Zo
        // claimt een middenklik, ctrl-klik of gedeelde link nooit iets wat
        // niet gebeurd is (zie onClick hieronder voor de geslaagde-kopie-pad).
        trigger.setAttribute('data-cik-modus', 'klembord');
      } else {
        trigger.href = url;
        trigger.setAttribute('data-cik-modus', 'direct');
      }
      trigger.setAttribute('data-cik-ready', '');
    }

    if (promptTemplate) {
      verwerk(promptTemplate);
    } else {
      const promptSrc = trigger.getAttribute('data-prompt-src');
      if (!promptSrc) {
        if (typeof console !== 'undefined') {
          console.warn('chatgpt-intake-knop: trigger mist data-prompt-src en er is geen promptTemplate');
        }
      } else {
        fetch(new URL(promptSrc, doc.baseURI))
          .then((res) => {
            if (!res.ok) throw new Error(`kon prompt niet laden (${res.status})`);
            return res.text();
          })
          .then(verwerk)
          .catch((err) => {
            if (cancelled) return;
            if (typeof console !== 'undefined') {
              console.warn('chatgpt-intake-knop: prompt laden mislukt, no-JS-link blijft staan', err);
            }
          });
      }
    }

    async function kopieerNaarKlembord(tekst) {
      if (win.navigator && win.navigator.clipboard && win.navigator.clipboard.writeText) {
        try {
          await win.navigator.clipboard.writeText(tekst);
          return true;
        } catch {
          /* val terug op execCommand */
        }
      }
      try {
        const ta = doc.createElement('textarea');
        ta.value = tekst;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        doc.body.appendChild(ta);
        ta.select();
        const ok = !!(doc.execCommand && doc.execCommand('copy'));
        ta.remove();
        return ok;
      } catch {
        return false;
      }
    }

    function toonFeedback(tekst, status) {
      feedback.textContent = tekst;
      setOrRemove(feedback, 'data-cik-status', status || null);
    }

    let handmatigDialog = null;
    let handmatigTextarea = null;

    // N2-fix (beta-herronde 25-09): het tekstvak stond eerst gewoon als
    // flow-element in `.cik__wrap`, en groeide dus de omringende layout mee
    // — in de navigatie werd de kopbalk zo 78 → 211px en schoof over het
    // logo heen. Een `<dialog>` (top-layer, aan `document.body` gehangen,
    // dus volledig los van waar de trigger in de pagina staat) kan de
    // omringende layout per definitie niet raken, en krijgt Escape-sluiten
    // en focus-terug gratis van de browser.
    function toonHandmatigDialog(tekst) {
      if (!handmatigDialog) {
        handmatigDialog = doc.createElement('dialog');
        handmatigDialog.className = 'cik__dialog';
        handmatigDialog.setAttribute('aria-labelledby', 'cik-dialog-titel');

        const titel = doc.createElement('p');
        titel.className = 'cik__dialog-titel';
        titel.id = 'cik-dialog-titel';
        titel.textContent = 'Kopiëren lukte niet';

        const uitleg = doc.createElement('p');
        uitleg.className = 'cik__dialog-uitleg';
        uitleg.textContent = 'Selecteer de tekst hieronder en kopieer hem zelf (Cmd/Ctrl+C).';

        handmatigTextarea = doc.createElement('textarea');
        handmatigTextarea.className = 'cik__dialog-textarea';
        handmatigTextarea.readOnly = true;
        handmatigTextarea.setAttribute('aria-label', 'De volledige intakeprompt om zelf te kopiëren');

        const sluitKnop = doc.createElement('button');
        sluitKnop.type = 'button';
        sluitKnop.className = 'cik__dialog-sluit';
        sluitKnop.textContent = 'Sluiten';
        sluitKnop.addEventListener('click', () => handmatigDialog.close());

        handmatigDialog.append(titel, uitleg, handmatigTextarea, sluitKnop);
        handmatigDialog.addEventListener('close', () => {
          if (typeof trigger.focus === 'function') trigger.focus();
        });
        doc.body.appendChild(handmatigDialog);
      }
      handmatigTextarea.value = tekst;
      handmatigDialog.showModal();
      handmatigTextarea.focus();
      handmatigTextarea.select();
    }

    async function onClick(e) {
      if (!trigger.hasAttribute('data-cik-ready')) return; // prompt nog niet klaar: gewone no-JS-navigatie
      if (trigger.getAttribute('data-cik-modus') !== 'klembord') return; // direct-modus: browser navigeert zelf
      // G2-fix: middenklik/ctrl/cmd/shift-klik niet onderscheppen — de
      // browser opent de (altijd ware) href gewoon zelf in een nieuw
      // tabblad/venster, zonder dat wij een kopieerpoging of een claim
      // daarover toevoegen. (Een echte middenklik vuurt sowieso "auxclick",
      // geen "click" — deze guard vangt ctrl/cmd/shift+klik af.)
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      const gelukt = await kopieerNaarKlembord(promptTekst);
      if (gelukt) {
        toonFeedback(`Prompt gekopieerd — plak hem in ${NAAM[target]}`, 'gelukt');
        // Alleen ná een daadwerkelijk geslaagde kopie openen we de chat met
        // de "…is zojuist gekopieerd"-instructie — de href zelf blijft altijd
        // het neutrale promptbestand (zie verwerk() hierboven).
        win.open(bouwUrl(KORTE_INSTRUCTIE), '_blank', 'noopener');
      } else {
        toonFeedback('Kopiëren lukte niet — de prompt staat klaar om handmatig te kopiëren.', 'fout');
        toonHandmatigDialog(promptTekst);
      }
    }

    trigger.addEventListener('click', onClick);

    return function cleanupTrigger() {
      cancelled = true;
      trigger.removeEventListener('click', onClick);
      feedback.remove();
      if (handmatigDialog) handmatigDialog.remove();
      trigger.removeAttribute('data-cik-ready');
      trigger.removeAttribute('data-cik-modus');
      setOrRemove(trigger, 'href', oorspronkelijk.href);
      setOrRemove(trigger, 'target', oorspronkelijk.target);
      setOrRemove(trigger, 'rel', oorspronkelijk.rel);
      setOrRemove(trigger, 'aria-label', oorspronkelijk.ariaLabel);
      // G1-fix: de .cik__wrap-verpakking weer ontvouwen — trigger terug op
      // zijn oorspronkelijke plek in de DOM, wrap weg.
      oorspronkelijk.parent.insertBefore(trigger, oorspronkelijk.volgende);
      wrap.remove();
    };
  }

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    cleanups.forEach((fn) => fn());
  };
}

function setOrRemove(el, attr, waarde) {
  if (waarde === null || waarde === undefined) el.removeAttribute(attr);
  else el.setAttribute(attr, waarde);
}

function vervangPlaceholders(tekst, waarden) {
  return tekst.replace(/\{\{\s*(\w+)\s*\}\}/g, (heel, key) => (key in waarden ? waarden[key] : heel));
}

/**
 * Verwijdert een leidend HTML-commentaarblok (`<!-- ... -->`, eventueel
 * gevolgd door lege regels) van het begin van de prompttekst. Dat is de
 * expliciete marker voor documentatie-die-niet-mee-mag (zie
 * intake-prompt.md) — alleen aan het BEGIN van het bestand, zodat een
 * commentaar dat een bouwer bewust verderop in de prompt zet met opzet blijft
 * staan.
 */
function stripLeidendCommentaar(tekst) {
  return tekst.replace(/^\s*<!--[\s\S]*?-->\s*/, '');
}
