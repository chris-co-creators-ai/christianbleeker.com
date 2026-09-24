import assert from "node:assert/strict";
import { test } from "node:test";

test("header opens the complete website intake prompt in a new ChatGPT tab", async () => {
  const response = await fetch("http://localhost:3100/");
  assert.equal(response.status, 200);

  const html = await response.text();
  const anchor = html.match(/<a\b[^>]*href="(https:\/\/chatgpt\.com\/\?prompt=[^"]+)"[^>]*>[\s\S]*?<\/a>/);
  assert.ok(anchor, "ChatGPT checklist link is present");
  assert.match(anchor[0], /target="_blank"/);
  assert.match(anchor[0], /Website-checklist/);
  assert.match(anchor[0], /chatgpt_logo\.png/);

  const url = new URL(anchor[1].replaceAll("&amp;", "&"));
  assert.equal(url.origin, "https://chatgpt.com");
  const prompt = url.searchParams.get("prompt");
  assert.ok(prompt?.startsWith("ROL EN DOEL\n"));
  assert.match(prompt, /DEEL 6 — CONTROLE VÓÓR JE HET BESTAND GEEFT/);
  assert.match(prompt, /Zeg na het bestand in twee zinnen/);
});
