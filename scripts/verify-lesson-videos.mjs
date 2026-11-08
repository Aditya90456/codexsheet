// Proves the lesson rail plays real videos: every id in src/love-babbar-lessons.ts
// is asked of YouTube's own oEmbed endpoint, and the embed host the player uses is
// fetched for a sample. Nothing here is a stub - a video that was deleted, made
// private or listed under a different channel fails the run.
//   node scripts/verify-lesson-videos.mjs
import { readFileSync } from "node:fs";
import { lessonVideos } from "../src/love-babbar-lessons.ts";

const dump = JSON.parse(readFileSync(new URL("./data/love-babbar-playlist.json", import.meta.url), "utf8"));

const oembed = (videoId) => `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;

async function lookup(row, attempt = 0) {
  try {
    const response = await fetch(oembed(row.videoId));
    if (response.status === 429 || response.status >= 500) throw new Error(`http ${response.status}`);
    if (!response.ok) return { row, ok: false, why: `http ${response.status}` };
    const body = await response.json();
    return { row, ok: true, author: body.author_name, title: body.title, embeddable: body.is_embeddable !== false };
  } catch (error) {
    if (attempt < 3) return lookup(row, attempt + 1);
    return { row, ok: false, why: String(error.message ?? error) };
  }
}

const results = [];
const queue = [...lessonVideos];
async function worker() {
  while (queue.length) results.push(await lookup(queue.shift()));
}
await Promise.all(Array.from({ length: 6 }, worker));

const failed = results.filter((item) => !item.ok);
const notEmbeddable = results.filter((item) => item.ok && !item.embeddable);
const wrongChannel = results.filter((item) => item.ok && !/codehelp|babbar/i.test(item.author ?? ""));
// The playlist number in the title is what the lecture column claims, so a row
// that resolves to a different lecture is a mapping error, not a dead video.
const byId = new Map(dump.map((item) => [item.id, item]));
const lostNumber = lessonVideos.filter((row) => {
  const item = results.find((result) => result.row.videoId === row.videoId);
  const source = byId.get(row.videoId);
  return item?.ok && /^Lecture\s*\d+/i.test(source?.title ?? "") && !new RegExp(`Lecture\\s*${row.lecture}`, "i").test(item.title ?? "");
});

const sample = results.filter((item) => item.ok).slice(0, 8);
const embedChecks = [];
for (const item of sample) {
  const url = `https://www.youtube-nocookie.com/embed/${item.row.videoId}?rel=0&modestbranding=1`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await response.text();
  embedChecks.push(`${item.row.videoId} -> http ${response.status}, player ${/iframe|ytInitialPlayerResponse|embedder/i.test(html) ? "served" : "no player markup"}`);
}

console.log(`rows ${lessonVideos.length} · oembed ok ${results.length - failed.length} · failed ${failed.length}`);
console.log(`not embeddable ${notEmbeddable.length} · wrong channel ${wrongChannel.length} · lecture number not in title ${lostNumber.length}`);
console.log("channels: " + [...new Set(results.filter((item) => item.ok).map((item) => item.author))].join(" | "));
console.log("embed host sample:\n  " + embedChecks.join("\n  "));
if (failed.length) console.log("failed:\n  " + failed.map((item) => `${item.row.videoId} ${item.row.title} - ${item.why}`).join("\n  "));
if (wrongChannel.length) console.log("wrong channel:\n  " + wrongChannel.map((item) => `${item.row.videoId} -> ${item.author}`).join("\n  "));
if (notEmbeddable.length) console.log("not embeddable:\n  " + notEmbeddable.map((item) => `${item.row.videoId} ${item.row.title}`).join("\n  "));
if (failed.length || notEmbeddable.length || wrongChannel.length) process.exitCode = 1;
