import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { redirects as oudeSiteRedirects } from "./src/content/redirects";
import { site } from "./src/content/site";
import { bouwCsp, type CspBronnen } from "./src/lib/csp";

// Externe domeinen die een gekozen onderdeel nodig heeft, bv. video-facade:
// { "frame-src": ["https://www.youtube-nocookie.com"], "img-src": ["https://i.ytimg.com"] }.
// Standaard leeg: de kale basis laadt niets van buiten.
const cspExtra: CspBronnen = { "frame-src": ["https://www.youtube-nocookie.com"] };

// Pin the workspace root to this project so a stray package-lock.json in a
// parent directory can't hijack Turbopack's root inference.
const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Expliciet (Next.js se eigen default is ook `false`) — zonder dit kan een pad met en zonder
  // trailing slash allebei bestaan, wat een crawler als twee verschillende URL's voor dezelfde
  // pagina ziet (duplicate content). `sitemap.ts` bouwt overal paden zonder trailing slash, dus
  // dit moet daarmee overeenkomen.
  trailingSlash: false,

  // Geen `output: "standalone"` — dat is voor een eigen Docker-image (zie `Dockerfile`/
  // `docker-compose.yml`, buiten deze template zelf). Op Vercel (de standaard-deploy van deze
  // template, zie AGENTS.md) bouwt de standaard-output — geen `output`-optie — het project via
  // Vercel's eigen Build Output API; `standalone` is daar overbodig en is precies wat je weer
  // toevoegt zodra je zelf buiten Vercel (Docker) uitrolt.
  turbopack: {
    root: projectRoot,
  },
  images: {
    // next/image weigert SVG's te optimaliseren tenzij dit expliciet aan staat (XSS-voorzorg
    // tegen gebruikers-geüploade SVG's) — een klantsite die een SVG-logo in `public/` zet (een
    // eigen, vast bestand, geen upload) heeft dit nodig.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },

  // Doorverwijzingen van een oude site — standaard leeg, zie `src/content/redirects.ts` en
  // `scripts/oude-site-urls.mjs` voor hoe je die lijst vult.
  async redirects() {
    return oudeSiteRedirects.map((r) => ({
      source: r.van,
      destination: r.naar,
      permanent: r.permanent,
    }));
  },

  // Beveiligingsheaders, op elk pad. Mét Content-Security-Policy, zonder nonce
  // (een nonce maakt elke pagina dynamisch): `'unsafe-inline'` blijft nodig voor de JSON-LD en de
  // toestemmingsscripts, maar de rest (object/base/form/frame/connect) is streng. Zie src/lib/csp.ts.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: bouwCsp({
              meting: site.meting,
              extra: cspExtra,
              dev: process.env.NODE_ENV === "development",
              preview: process.env.VERCEL_ENV === "preview",
            }),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Dubbelop met CSP `frame-ancestors`, maar oudere browsers kennen alleen deze.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
