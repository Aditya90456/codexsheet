// Builds every pattern deck with the exact code the browser runs, writes real
// .pptx files into .study-packs/, and checks the parts PowerPoint needs:
// [Content_Types].xml, ppt/presentation.xml, one notesSlide per slide, and text
// in those notes.
//   npx vite build --ssr scripts/study-pack-check.mjs --outDir .study-pack-ssr
//   node .study-pack-ssr/study-pack-check.mjs
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";
import { patternCards } from "../src/dsaPatterns.ts";
import { buildPatternDeck } from "../src/studyPack.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".study-packs");
mkdirSync(out, { recursive: true });

/** Walk the stored local file headers of the zip and return name + bytes. */
function zipParts(buffer) {
  const parts = [];
  let offset = 0;
  while (buffer.readUInt32LE(offset) === 0x04034b50) {
    const method = buffer.readUInt16LE(offset + 10);
    const compressed = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const name = buffer.subarray(offset + 30, offset + 30 + nameLength).toString("utf8");
    const start = offset + 30 + nameLength + extraLength;
    parts.push({ name, method, bytes: buffer.subarray(start, start + compressed) });
    offset = start + compressed;
  }
  return parts;
}

/** ZIP stores raw deflate, so method 8 needs inflateRaw and method 0 is the bytes as they are. */
const textOf = (part) => {
  const xml = part.method === 8 ? inflateRawSync(part.bytes).toString("utf8") : part.bytes.toString("utf8");
  return [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((match) => match[1]).join(" ").trim();
};

const rows = [];
let firstSample = "";
for (const card of patternCards) {
  const { data, meta } = await buildPatternDeck(card, "nodebuffer");
  const filePath = join(out, meta.fileName);
  writeFileSync(filePath, Buffer.from(data));

  const parts = zipParts(readFileSync(filePath));
  const slides = parts.filter((part) => /^ppt\/slides\/slide\d+\.xml$/.test(part.name));
  const notes = parts.filter((part) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(part.name));
  const emptyNotes = notes.filter((note) => textOf(note).length < 40).length;
  rows.push({
    deck: meta.fileName.replace("codexsheet-", "").replace(".pptx", ""),
    kb: Math.round(statSync(filePath).size / 1024),
    slides: slides.length,
    declared: meta.slides,
    notes: notes.length,
    thinNotes: emptyNotes,
    longestNoteChars: Math.max(...notes.map((note) => textOf(note).length)),
    assignments: meta.assignments,
    contentTypes: parts.some((part) => part.name === "[Content_Types].xml"),
    presentation: parts.some((part) => part.name === "ppt/presentation.xml"),
    rels: parts.some((part) => part.name === "ppt/_rels/presentation.xml.rels"),
  });
  if (!firstSample && notes.length > 1) firstSample = textOf(notes[1]).slice(0, 300);
}

console.table(rows);
console.log("decks written:", readdirSync(out).length);
console.log("sample speaker note:", firstSample);
