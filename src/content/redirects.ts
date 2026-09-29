/**
 * Doorverwijzingen van de oude site — STANDAARD LEEG. Vul deze lijst als je een bestaande site
 * vervangt en er paden zijn die op de nieuwe site niet meer (op datzelfde adres) bestaan: zonder
 * een redirect krijgt een bezoeker (en Google) daar een 404.
 *
 * `scripts/oude-site-urls.mjs <oude-domein>` haalt de sitemap(s) van de oude site op en schrijft
 * een `redirects-voorstel.tsv` met, per oud pad, een voorgestelde `naar` (hetzelfde pad als dat
 * op de nieuwe site bestaat, anders `/`). Controleer dat voorstel — het is een VOORSTEL, geen
 * garantie dat de inhoud overeenkomt — en zet de regels die je overneemt hieronder.
 *
 * `van`/`naar` zijn paden, geen hele URL's (zoals `next.config.ts`s `redirects()` verwacht, zie
 * `source`/`destination` in de Next.js-documentatie). `permanent: true` → 308 (voor altijd
 * verplaatst, browsers/zoekmachines cachen 'm hard); `permanent: false` → 307 (tijdelijk, niet
 * gecachet). Twijfel je: gebruik `false` — een 307 is achteraf makkelijker te corrigeren dan een
 * hard-gecachete 308.
 */
export type OudeSiteRedirect = { van: string; naar: string; permanent: boolean }

export const redirects: OudeSiteRedirect[] = []
