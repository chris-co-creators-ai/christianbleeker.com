import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("Over mij shows all seven LinkedIn recommendations as full-size openable screenshots", async () => {
  const html = await readFile(new URL("../.next/server/app/about.html", import.meta.url), "utf8");
  const experiences = html.split(">Ervaringen</h2>")[1]?.split(">In gesprek</h2>")[0];
  assert.ok(experiences);

  for (const name of ["sven", "gina", "els", "annemieke", "bernard", "edwin", "ela"]) {
    assert.ok(experiences.includes(`review_${name}_christian_bleeker_ai_expert.png`), `Missing ${name}'s image`);
  }

  assert.ok(experiences.includes("lg:grid-cols-2"));
  assert.ok(experiences.includes("lg:pt-12"));
  assert.ok(experiences.includes("h-auto w-full"));
  assert.ok(!experiences.includes("<blockquote"));
  assert.ok(!experiences.includes("Stefan Radstok"));
});
