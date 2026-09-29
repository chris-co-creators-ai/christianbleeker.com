---
name: goseo
description: Use when the user explicitly invokes /goseo or asks for a coordinated weekly SEO and AI-search run across the specialist team.
---

# Go SEO — Claude Code

Run the weekly SEO/AEO chain in the **explicitly identified** customer project and domain. Read the canonical `.seo-team/roles/*.md` files needed for each step and, where useful, delegate to the matching `.claude/agents/` specialists. If the project root, site/domain, ownership or scope is ambiguous, ask before writing. Use `<project>/output/seo/YYYY-Www/` (ISO week), inspect existing files first and never silently overwrite finished work.

## Phase 1 — Analyse

1. Connie → `connie-analyse.md`; Dora → `dora-analyse.md`. They may run together as independent subagents.
2. Kiki reads both → `kiki-vragenlijst.md`.
3. Saar reads Kiki → `saar-weekprioriteiten.md`, selecting one evidenced priority.

## Phase 2 — Content

4. Coco reads Saar → `coco-ruwe-content.md`, with sources and factchecks.
5. Aafke reads Coco → `aafke-aeo-content.md`, direct verified answer before context. An opener near 40–60 words is editorial preference, not an SEO rule; omit unsupported claims.
6. Sjoerd reads Aafke → `sjoerd-schema.json` when suitable or `sjoerd-schema-notitie.md` when not. Never add `FAQPage` by default.

## Phase 3 — Optimalisatie en vervolg

7. Onno reads Aafke and Sjoerd → `onno-ready-to-publish.md` or proposed source diff, without publishing.
8. Lola reads the draft and a verified page inventory (sitemap, CMS, routes or crawl) → `lola-linkplan.md`. If no pages can be verified, record the gap instead of inventing links.
9. Timo checks the real site when possible → `timo-techniekrapport.md`, separating search crawlers from training controls.
10. Boris → `boris-outreachvoorstellen.md`, proposals only.
11. Rinus → `rinus-nulmeting.md` and `rinus-vervolgplan.md`; 72 hours is a first check, never a visibility guarantee.

Check input files and evidence before each dependent step. Label missing data `onbekend` and stop a handoff if necessary rather than inventing it. Report the selected opportunity, produced files, unresolved approvals and next measurement. Do not deploy, change robots/crawler preferences or contact third parties without separate authorization.
