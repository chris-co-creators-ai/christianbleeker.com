import assert from "node:assert/strict";
import { test } from "node:test";

const base = process.env.CLONE_BASE_URL ?? "http://localhost:3100";
const projectRoutes = [
  "kinderopvang-ikke", "radstok-interim", "win-instituut", "driftawave",
  "co-creatie-ai", "souplesse-runners-boutique", "offbeat-peak",
  "digital-waves", "fuselabs",
];

for (const [route, expected] of [
  ["/", "Jouw verhaal"],
  ["/about", "Over mij"],
  ["/work", "Elk merk"],
  ...projectRoutes.map(slug => [`/work/${slug}`, "Ontwerpdoel"]),
]) {
  test(`route ${route} presents Chris Bleeker's content`, async () => {
    const response = await fetch(new URL(route, base));
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.ok(html.includes(expected), `Missing ${expected} on ${route}`);
    assert.ok(html.includes("Chris Bleeker"), `Missing Chris Bleeker on ${route}`);
    assert.ok(!/Arturo Spatino|Design by Art|ciao@arturospatino\.com/.test(html), `Arturo content on ${route}`);
    assert.ok(!/Capital Plus Auditing|A\/C Man|I Wood Decor|WACCC/.test(html), `Excluded project on ${route}`);
  });
}

for (const route of ["/work/4fett", "/work/togevent", "/work/bounty-hunters", "/work/kiwi"]) {
  test(`retired route ${route} does not appear as a project`, async () => {
    const response = await fetch(new URL(route, base));
    assert.equal(response.status, 404, route);
  });
}

test("Human Margin is replaced by Radstok Interim", async () => {
  const work = await (await fetch(new URL("/work", base))).text();
  assert.ok(work.includes("Radstok Interim"));
  assert.ok(!work.includes("Human Margin"));
  assert.equal((await fetch(new URL("/work/human-margin", base))).status, 404);
});

test("all nine portfolio cases use their own cover and wide hero creative", async () => {
  for (const slug of projectRoutes) {
    const page = await (await fetch(new URL(`/work/${slug}`, base))).text();
    assert.ok(page.includes(`projects/${slug}-hero.png`), `${slug} must show its case hero`);
    const cover = await fetch(new URL(`/chris/projects/${slug}-cover.png`, base));
    const hero = await fetch(new URL(`/chris/projects/${slug}-hero.png`, base));
    assert.equal(cover.status, 200, `${slug} cover must be served`);
    assert.equal(hero.status, 200, `${slug} hero must be served`);
    assert.match(cover.headers.get("content-type") ?? "", /image\/png/);
    assert.match(hero.headers.get("content-type") ?? "", /image\/png/);
  }
});

test("own product and media from Chris's original site are represented", async () => {
  const work = await (await fetch(new URL("/work", base))).text();
  const about = await (await fetch(new URL("/about", base))).text();
  assert.ok(work.includes("Dicteren.ai") && work.includes("/chris/team/brian.jpeg") && work.includes("/chris/team/lars.png"));
  assert.ok(about.includes("DenkProducties") && about.includes('src="https://open.spotify.com/embed/episode/3En3qEFfzzAaWAwRslOUJq"'));
});
