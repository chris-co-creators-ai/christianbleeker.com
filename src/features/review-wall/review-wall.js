/**
 * review-wall
 * ------------------------------------------------------------------------
 * Toont reviews uit JSON (naam, datum, score, tekst, bron-link) als raster
 * of carrousel, met een score-badge (berekend uit de reviews, of vast
 * opgegeven met een bronvermelding — R9: nooit allebei tegelijk tonen) en
 * een "lees meer" per kaart voor lange teksten. Lege data verbergt de hele
 * sectie (geen kapotte lege reviewwand, R5/R8).
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt window/document pas
 * aan in `init()`.
 *
 * @typedef {Object} Review
 * @property {string} naam
 * @property {string} datum ISO-datum (JJJJ-MM-DD).
 * @property {number} score 1-5.
 * @property {string} tekst
 * @property {string} [bron] Naam van het platform (bv. "Google").
 * @property {string} [bronUrl] Link naar de originele review.
 *
 * @param {Element} root Sectie met `data-review-wall`. Bevat een `<script type="application/json" data-rw-reviews>` met een `Review[]`, en een `[data-rw-lijst]`-container waar de kaarten in komen.
 * @param {{ reviews?: Review[], scoreVast?: number, scoreBron?: string, weergave?: 'raster'|'carrousel', schemaOrg?: boolean }} [opties]
 * @returns {() => void} destroy — leegt de gerenderde kaarten/score en zet zichtbaarheid terug. Idempotent.
 */
import { vereisRoot } from '../../_kwaliteit/basis.js';

export function berekenScore(reviews) {
  if (!reviews || reviews.length === 0) return { score: 0, aantal: 0 };
  const som = reviews.reduce((acc, r) => acc + Number(r.score || 0), 0);
  return { score: Math.round((som / reviews.length) * 10) / 10, aantal: reviews.length };
}

export function formatteerScore(score) {
  return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(score);
}

function bouwSterren(doc, score) {
  const wrap = doc.createElement('span');
  wrap.className = 'rw__sterren';
  wrap.setAttribute('aria-hidden', 'true');
  const vol = Math.round(score);
  wrap.textContent = '★★★★★'.slice(0, vol) + '☆☆☆☆☆'.slice(0, 5 - vol);
  return wrap;
}

function bouwKaart(doc, review) {
  const li = doc.createElement('li');
  li.className = 'rw__kaart';

  const kop = doc.createElement('div');
  kop.className = 'rw__kop';
  kop.appendChild(bouwSterren(doc, review.score));
  const srScore = doc.createElement('span');
  srScore.className = 'rw__sr';
  srScore.textContent = `${review.score} van de 5 sterren`;
  kop.appendChild(srScore);
  li.appendChild(kop);

  const tekst = doc.createElement('p');
  tekst.className = 'rw__tekst';
  tekst.textContent = review.tekst;
  li.appendChild(tekst);

  const meerBtn = doc.createElement('button');
  meerBtn.type = 'button';
  meerBtn.className = 'rw__meer';
  meerBtn.hidden = true;
  meerBtn.setAttribute('aria-expanded', 'false');
  meerBtn.textContent = 'Lees meer';
  meerBtn.addEventListener('click', () => {
    const open = tekst.classList.toggle('is-open');
    meerBtn.setAttribute('aria-expanded', String(open));
    meerBtn.textContent = open ? 'Lees minder' : 'Lees meer';
  });
  li.appendChild(meerBtn);

  const voet = doc.createElement('div');
  voet.className = 'rw__voet';
  const naam = doc.createElement('span');
  naam.className = 'rw__naam';
  naam.textContent = review.naam;
  voet.appendChild(naam);

  if (review.datum) {
    const tijd = doc.createElement('time');
    tijd.setAttribute('datetime', review.datum);
    tijd.textContent = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${review.datum}T00:00:00`));
    voet.appendChild(tijd);
  }
  if (review.bron) {
    if (review.bronUrl) {
      const a = doc.createElement('a');
      a.href = review.bronUrl;
      a.rel = 'noopener';
      a.target = '_blank';
      a.className = 'rw__bron';
      a.textContent = `via ${review.bron}`;
      voet.appendChild(a);
    } else {
      const span = doc.createElement('span');
      span.className = 'rw__bron';
      span.textContent = `via ${review.bron}`;
      voet.appendChild(span);
    }
  }
  li.appendChild(voet);

  return li;
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'review-wall')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const reviewsEl = root.querySelector('[data-rw-reviews]');
  let reviews = opties.reviews || null;
  if (!reviews && reviewsEl) {
    try {
      reviews = JSON.parse(reviewsEl.textContent);
    } catch (err) {
      console.warn('review-wall: kon [data-rw-reviews] niet parsen als JSON — sectie verborgen', err);
      reviews = [];
    }
  }
  reviews = Array.isArray(reviews) ? reviews : [];

  const wasAlVerborgen = root.hasAttribute('hidden');
  if (reviews.length === 0) {
    console.warn('review-wall: geen reviews gevonden — sectie verborgen (geen lege reviewwand tonen)');
    root.setAttribute('hidden', '');
    return function destroy() {
      if (!wasAlVerborgen) root.removeAttribute('hidden');
    };
  }
  root.removeAttribute('hidden');

  const lijstEl = root.querySelector('[data-rw-lijst]');
  if (!lijstEl) {
    console.warn('review-wall: geen [data-rw-lijst] gevonden — overgeslagen');
    return () => {};
  }

  // --- score-badge: vaste waarde (met bron) wint van de berekening -------
  const scoreEl = root.querySelector('[data-rw-score]');
  const scoreVastAttr = opties.scoreVast ?? scoreEl?.getAttribute('data-score-vast');
  const scoreBronAttr = opties.scoreBron ?? scoreEl?.getAttribute('data-score-bron');
  let score;
  let aantal;
  let scoreBronTekst = null;
  if (scoreVastAttr !== undefined && scoreVastAttr !== null && scoreVastAttr !== '') {
    score = Number(scoreVastAttr);
    aantal = null;
    scoreBronTekst = scoreBronAttr || null;
  } else {
    ({ score, aantal } = berekenScore(reviews));
  }

  let scoreOrigineleHTML = null;
  if (scoreEl) {
    scoreOrigineleHTML = scoreEl.innerHTML;
    scoreEl.textContent = '';
    const getal = doc.createElement('strong');
    getal.textContent = formatteerScore(score);
    scoreEl.appendChild(getal);
    const detail = doc.createElement('span');
    detail.className = 'rw__score-detail';
    detail.textContent = scoreBronTekst ? ` · ${scoreBronTekst}` : ` uit 5 · ${aantal} ${aantal === 1 ? 'review' : 'reviews'}`;
    scoreEl.appendChild(detail);
  }

  // --- kaarten renderen ----------------------------------------------------
  const origineleLijstHTML = lijstEl.innerHTML;
  lijstEl.innerHTML = '';
  const frag = doc.createDocumentFragment();
  for (const review of reviews) frag.appendChild(bouwKaart(doc, review));
  lijstEl.appendChild(frag);

  // "Lees meer" alleen tonen als de tekst ook echt afgeknot is (line-clamp).
  for (const tekstEl of lijstEl.querySelectorAll('.rw__tekst')) {
    if (tekstEl.scrollHeight > tekstEl.clientHeight + 1) {
      tekstEl.nextElementSibling.hidden = false;
    }
  }

  // --- weergave: raster (standaard) of carrousel ---------------------------
  const weergave = opties.weergave ?? root.getAttribute('data-weergave') ?? 'raster';
  root.setAttribute('data-rw-weergave', weergave);

  let vorigeKnop = null;
  let volgendeKnop = null;
  let vorigeHandler = null;
  let volgendeHandler = null;
  if (weergave === 'carrousel') {
    vorigeKnop = root.querySelector('[data-rw-vorige]');
    volgendeKnop = root.querySelector('[data-rw-volgende]');
    const scrollDelta = () => (lijstEl.firstElementChild ? lijstEl.firstElementChild.getBoundingClientRect().width + 16 : 300);
    vorigeHandler = () => lijstEl.scrollBy({ left: -scrollDelta(), behavior: 'smooth' });
    volgendeHandler = () => lijstEl.scrollBy({ left: scrollDelta(), behavior: 'smooth' });
    vorigeKnop?.addEventListener('click', vorigeHandler);
    volgendeKnop?.addEventListener('click', volgendeHandler);
  }

  // --- schema.org AggregateRating (optioneel) -------------------------------
  let ldjsonEl = null;
  const wantSchemaOrg = opties.schemaOrg ?? root.hasAttribute('data-schema-org');
  if (wantSchemaOrg) {
    ldjsonEl = doc.createElement('script');
    ldjsonEl.type = 'application/ld+json';
    ldjsonEl.setAttribute('data-rw-ldjson', '');
    ldjsonEl.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'AggregateRating',
      ratingValue: score,
      reviewCount: aantal ?? reviews.length,
    });
    root.appendChild(ldjsonEl);
  }

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    lijstEl.innerHTML = origineleLijstHTML;
    if (scoreEl && scoreOrigineleHTML !== null) scoreEl.innerHTML = scoreOrigineleHTML;
    if (vorigeKnop && vorigeHandler) vorigeKnop.removeEventListener('click', vorigeHandler);
    if (volgendeKnop && volgendeHandler) volgendeKnop.removeEventListener('click', volgendeHandler);
    root.removeAttribute('data-rw-weergave');
    if (ldjsonEl && ldjsonEl.parentNode) ldjsonEl.remove();
    if (!wasAlVerborgen) root.removeAttribute('hidden');
  };
}
