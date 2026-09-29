/**
 * Vertaal-validator — geen stille NL-fallback. Elk `content/*.xx.ts`-bestand roept
 * `valideerVertaling('xx', eigenExport, nlReferentie)` aan bij het laden van de module (dus tijdens
 * `next build`, vóórdat er ook maar iets gerenderd wordt). Ontbreekt of is leeg een veld dat in de
 * NL-referentie wél gevuld is, dan gooit dit een `Error` met het exacte veldpad + de taal erin —
 * dat laat `next build`/`npm run check` falen met een duidelijke melding (zie de opdracht: "build
 * faalt met veld en taal in de melding").
 *
 * TypeScript's eigen structurele check (elk `content/site.xx.ts` is getypeerd als `SiteInhoud`)
 * vangt al een compleet WEGGELATEN verplicht veld af (compile-fout). Deze validator vangt het
 * geval dat TypeScript niet kan zien: een veld dat er wél staat maar leeg is gebleven (bv. een
 * vergeten vertaling die als `''` is blijven staan) — zie `docs/SEO.md` § 2 voor de tegenproef.
 */
export function valideerVertaling(taal: string, vertaling: unknown, referentie: unknown, pad = ''): void {
  if (Array.isArray(referentie)) {
    if (!Array.isArray(vertaling) || vertaling.length !== referentie.length) {
      throw new Error(
        `Ontbrekende vertaling: veld "${pad || '(root)'}" heeft in taal "${taal}" niet dezelfde lengte `
        + `als de NL-referentie (${Array.isArray(vertaling) ? vertaling.length : 'geen array'} vs. ${referentie.length}).`,
      )
    }
    referentie.forEach((item, i) => valideerVertaling(taal, (vertaling as unknown[])[i], item, `${pad}[${i}]`))
    return
  }

  if (referentie !== null && typeof referentie === 'object') {
    for (const sleutel of Object.keys(referentie as Record<string, unknown>)) {
      const refWaarde = (referentie as Record<string, unknown>)[sleutel]
      const vertWaarde = (vertaling as Record<string, unknown> | null | undefined)?.[sleutel]
      valideerVertaling(taal, vertWaarde, refWaarde, pad ? `${pad}.${sleutel}` : sleutel)
    }
    return
  }

  // Alleen niet-lege NL-strings zijn verplicht vertaald — een NL-veld dat zelf al leeg is
  // (optioneel, bv. `telefoon: ''`) hoeft in een andere taal niet gevuld te zijn.
  if (typeof referentie === 'string' && referentie.trim() !== '') {
    if (typeof vertaling !== 'string' || vertaling.trim() === '') {
      throw new Error(`Ontbrekende vertaling: veld "${pad}" ontbreekt of is leeg in taal "${taal}".`)
    }
  }
}
