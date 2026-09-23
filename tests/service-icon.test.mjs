import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("design service animation contains only the rotating vector icon", async () => {
  const animation = JSON.parse(await readFile(new URL("../public/chris/service-2.json", import.meta.url), "utf8"));
  assert.ok(animation.layers.some(layer => layer.ty === 0), "rotating vector precomposition remains");
  assert.ok(animation.layers.every(layer => layer.ty !== 2), "no bitmap layer behind the icon");
  assert.ok(animation.assets.every(asset => !asset.p), "no unresolved bitmap asset is requested");
});
