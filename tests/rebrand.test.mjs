import assert from "node:assert/strict";
import { test } from "node:test";

const base = process.env.CLONE_BASE_URL ?? "http://localhost:3100";

test("homepage presents Chris Bleeker, not Arturo or excluded agencies", async () => {
  const response = await fetch(new URL("/", base));
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes("Chris Bleeker"));
  assert.ok(html.includes("Jouw verhaal"));
  assert.ok(html.includes("linkedin.com/in/christianbleeker"));
  assert.ok(!/Arturo Spatino|Design by Art|ciao@arturospatino\.com/.test(html));
  assert.ok(!/Capital Plus Auditing|A\/C Man|I Wood Decor|WACCC/.test(html));
});

test("animated logo band is monochrome without changing project logos", async () => {
  const html = await (await fetch(new URL("/", base))).text();
  assert.ok(html.includes('class="logo-marquee '), "Homepage must render the logo band");
  const stylesheets = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)]
    .map(([tag]) => tag.match(/href="([^"]+)"/)?.[1])
    .filter(Boolean);
  assert.ok(stylesheets.length > 0, "Homepage must load its styles");
  const css = (await Promise.all(stylesheets.map(async path => (await fetch(new URL(path, base))).text()))).join("\n");
  const marqueeRule = css.match(/\.logo-marquee img\s*\{([^}]*)\}/)?.[1];
  assert.ok(marqueeRule, "Only images inside the logo band need a monochrome rule");
  assert.match(marqueeRule, /filter:\s*grayscale\((?:1)?\)\s*contrast\(2\)/);
});

test("animated logo band covers wide screens without an empty interval", async () => {
  const html = await (await fetch(new URL("/", base))).text();
  const stylesheets = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)]
    .map(([tag]) => tag.match(/href="([^"]+)"/)?.[1])
    .filter(Boolean);
  const css = (await Promise.all(stylesheets.map(async path => (await fetch(new URL(path, base))).text()))).join("\n");
  const trackRule = css.match(/\.logo-marquee\s*\{([^}]*)\}/)?.[1] ?? "";
  const minWidthInViewports = Number(trackRule.match(/min-width:\s*([\d.]+)vw/)?.[1]) / 100;
  assert.ok(minWidthInViewports / 2 >= 1, "Each repeated half must cover at least one viewport");
  assert.match(trackRule, /justify-content:\s*space-around/, "Logos should fill the available space evenly");
});

test("thin Kinderopvang logo stays visible and Radstok replaces Human Margin in the monochrome band", async () => {
  const html = await (await fetch(new URL("/", base))).text();
  const images = [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag);
  assert.equal(images.filter(tag => tag.includes("marquee-line-logo")).length, 2);
  assert.equal(images.filter(tag => tag.includes("radstok-interim.svg")).length, 2);
  assert.ok(!html.includes("brand/human-margin.png"));
  const stylesheets = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)]
    .map(([tag]) => tag.match(/href="([^"]+)"/)?.[1])
    .filter(Boolean);
  const css = (await Promise.all(stylesheets.map(async path => (await fetch(new URL(path, base))).text()))).join("\n");
  assert.match(css, /\.marquee-line-logo\s*\{[^}]*filter:[^}]*brightness\(\.6\)[^}]*contrast\(10\)/);
});
