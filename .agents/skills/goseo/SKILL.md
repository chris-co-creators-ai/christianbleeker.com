---
name: goseo
description: Use when the user explicitly asks for a coordinated weekly SEO and AI-search run, says goseo, or wants all twelve SEO specialists to hand work across analysis, creation and optimization.
---

# Go SEO — Codex

Run a weekly, reviewable SEO/AEO cycle for the **explicitly identified** customer project and domain. Read the needed canonical role files under `<project>/.seo-team/roles/`; do not use roles or data from another project. If project root, site/domain, ownership or task scope is ambiguous, stop before writing and ask. Read existing output before continuing a week. Use ISO week path `<project>/output/seo/YYYY-Www/`; create it only in that project. Never overwrite a completed file silently.

## Phase 1 — Analyse

1. Connie writes `connie-analyse.md` and Dora writes `dora-analyse.md`. They are independent; parallelize only if the runtime supports it.
2. Kiki reads both and writes `kiki-vragenlijst.md`.
3. Saar reads Kiki and writes `saar-weekprioriteiten.md`, choosing one evidenced opportunity and recording open questions.

## Phase 2 — Content

4. Coco reads Saar, writes `coco-ruwe-content.md` with source list and factchecks.
5. Aafke reads Coco, writes `aafke-aeo-content.md`: direct, factual answer first, context after. A 40–60-word opener is optional editorial guidance, never an SEO rule. Unsupported claims stay out.
6. Sjoerd reads Aafke and writes `sjoerd-schema.json` only if truthful, visible-page schema is appropriate; otherwise `sjoerd-schema-notitie.md`. `FAQPage` is not the default.

## Phase 3 — Optimalisatie en vervolg

7. Onno reads Aafke and Sjoerd, writes `onno-ready-to-publish.md` or a proposed source diff, **not a deployment**.
8. Lola reads the draft and a verified page inventory (sitemap, CMS, routes or crawl), writes `lola-linkplan.md`. If no pages can be verified, record the gap instead of inventing links.
9. Timo inspects the actual site when available, writes `timo-techniekrapport.md`; distinguish search crawling from AI-training controls.
10. Boris writes `boris-outreachvoorstellen.md`, without contacting anyone.
11. Rinus writes `rinus-nulmeting.md` and `rinus-vervolgplan.md`; 72 hours is an initial checkpoint, not an indexation or AI Overview guarantee.

Before each handoff, verify the required input file exists and has evidence. Mark unknown metrics and inaccessible sources; do not fabricate a stage to keep the chain moving. End with a compact summary of the chosen opportunity, produced files, open approvals and next measurement. Do not publish, change robots/crawler preferences or send outreach without a separate instruction authorizing that action.
