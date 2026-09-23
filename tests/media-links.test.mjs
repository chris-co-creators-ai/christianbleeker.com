import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("About links the three supplied Bekend van images to their media", async () => {
  const html = await readFile(new URL("../.next/server/app/about.html", import.meta.url), "utf8");
  const known = html.split(">Bekend van</h2>")[1]?.split(">Websites</h2>")[0];
  assert.ok(known);
  assert.ok(known.includes("denkproducties_logo.jpg"));
  assert.ok(known.includes("tedxeindhoven-logo.jpeg"));
  assert.ok(known.includes("dat_is_wel_speciaal_podcast.jpg"));
  assert.ok(known.includes("https://www.denkproducties.nl/experts/chris-bleeker"));
  assert.ok(known.includes("https://www.youtube.com/watch?v=eOZOeLhRdcs"));
  assert.ok(known.includes("https://open.spotify.com/episode/3En3qEFfzzAaWAwRslOUJq"));
});

test("About shows a TEDx preview before loading the YouTube player", async () => {
  const html = await readFile(new URL("../.next/server/app/about.html", import.meta.url), "utf8");
  const talk = html.split("Mijn TEDx-talk</h3>")[1]?.split("Bekijk op YouTube ↗")[0];
  assert.ok(talk);
  assert.match(talk, /<button[^>]+aria-label="Speel mijn TEDx-talk af"/);
  assert.ok(talk.includes("tedx-stage-original.png"));
  assert.ok(!talk.includes("<iframe"));
});

test("About uses Spotify's standard episode embed for the supplied podcast", async () => {
  const html = await readFile(new URL("../.next/server/app/about.html", import.meta.url), "utf8");
  assert.ok(html.includes('src="https://open.spotify.com/embed/episode/3En3qEFfzzAaWAwRslOUJq"'));
  assert.ok(html.includes('height="352"'));
  assert.ok(html.includes("Dat is wel speciaal-podcast met Christian Bleeker"));
});

test("About omits the redundant Waar ik aan werk summary", async () => {
  const html = await readFile(new URL("../.next/server/app/about.html", import.meta.url), "utf8");
  assert.ok(!html.includes("Waar ik aan werk"));
  assert.ok(html.includes("Bekend van"));
});

test("About shows the supplied DenkProducties YouTube video beside the Spotify episode", async () => {
  const html = await readFile(new URL("../.next/server/app/about.html", import.meta.url), "utf8");
  const conversation = html.split(">In gesprek</h2>")[1]?.split("</section>")[0];
  assert.ok(conversation);
  assert.equal((conversation.match(/<article>/g) ?? []).length, 3);
  const podcast = conversation.split("Dat is wel speciaal</h3>")[1]?.split("</article>")[0];
  const denk = conversation.split("DenkTank bij DenkProducties</h3>")[1]?.split("</article>")[0];
  assert.ok(podcast?.includes("open.spotify.com/embed/episode/3En3qEFfzzAaWAwRslOUJq"));
  assert.ok(denk);
  assert.match(denk, /<button[^>]+aria-label="Speel de DenkTank-video af"/);
  assert.ok(denk.includes("i.ytimg.com%2Fvi%2FZAmHKw7I4YM%2Fmaxresdefault.jpg"));
  assert.ok(denk.includes("https://www.youtube.com/watch?v=ZAmHKw7I4YM"));
  assert.ok(!denk.includes("open.spotify.com"));
  assert.ok(!denk.includes("<iframe"));
});

test("Footer uses Christian's LinkedIn profile", async () => {
  const html = await readFile(new URL("../.next/server/app/about.html", import.meta.url), "utf8");
  assert.ok(html.includes("https://www.linkedin.com/in/christianbleeker/"));
});
