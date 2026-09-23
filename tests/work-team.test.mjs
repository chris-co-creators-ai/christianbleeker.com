import assert from "node:assert/strict";
import { test } from "node:test";

test("Dicteren.ai team appears as a large responsive portrait gallery on Work", async () => {
  const response = await fetch("http://localhost:3100/work");
  assert.equal(response.status, 200);
  const html = await response.text();
  const section = html.split(">Eigen product</h2>")[1]?.split("</section>")[0];
  assert.ok(section);
  assert.ok(section.includes("md:grid-cols-3"));
  assert.ok(section.includes("%2Fchris%2Fteam%2Fchris.png"));
  assert.ok(section.includes("%2Fchris%2Fteam%2Fbrian.jpeg"));
  assert.ok(section.includes("%2Fchris%2Fteam%2Flars.png"));
  assert.match(section, /<figcaption[^>]*>Chris<\/figcaption>/);
  assert.match(section, /<figcaption[^>]*>Brian<\/figcaption>/);
  assert.match(section, /<figcaption[^>]*>Lars<\/figcaption>/);
  assert.ok(!section.includes("rounded-full"));
});
