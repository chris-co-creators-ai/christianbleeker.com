import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("homepage uses Christian's unaltered original TEDx stage photo", async () => {
  const html = await readFile(new URL("../.next/server/app/index.html", import.meta.url), "utf8");
  assert.ok(html.includes("tedx-stage-original.png"));
  assert.ok(!html.includes("tedx-stage-restored-4k.jpg"));
  assert.ok(html.includes("Chris Bleeker op het podium bij TEDxEindhoven"));
  assert.ok(!html.includes("denkproducties-group.jpg"));

  const image = await readFile(new URL("../public/chris/media/tedx-stage-original.png", import.meta.url));
  assert.equal(createHash("sha256").update(image).digest("hex"), "16e2be75c0dbd1db06a5ecd113ec8dff6f9ad47b0243cb8f8bf63dfea860fca7");
});

test("About opens with a wide stage photo instead of the severely cropped portrait", async () => {
  const html = await readFile(new URL("../.next/server/app/about.html", import.meta.url), "utf8");
  const firstSection = html.match(/<main[^>]*><section[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(firstSection);
  assert.ok(firstSection.includes("tedx-stage-original.png"));
  assert.ok(firstSection.includes("aspect-[2/1]"));
  assert.ok(!firstSection.includes("chris-hero.jpg"));
});
