// Recolours the PNG brand assets with the same hue rotation as the stylesheets.
//
// The icons and the share image were rasterised from the old blue logo, and there
// is no image library in this project, so the pixels are read and written directly:
// inflate the IDAT, undo the scanline filters, rotate every colour that sits in the
// source hue band, and write the rows back unfiltered. Non-blue pixels - the green
// live dot, greys, the black background - go through untouched, and alpha is kept
// exactly as it was.
//
//   node scripts/theme-recolor-png.mjs --files public/favicon-32.png --from 196 --to 334 [--blacken]
import { readFileSync, writeFileSync } from "node:fs";
import { inflateSync, deflateSync } from "node:zlib";
import { shiftRgb } from "./color-shift.mjs";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};
const files = arg("files", "").split(",").filter(Boolean);
if (!files.length) {
  console.error("usage: node scripts/theme-recolor-png.mjs --files a.png,b.png --from 196 --to 334 [--blacken]");
  process.exit(1);
}
const options = {
  from: Number(arg("from", 196)),
  band: Number(arg("band", 72)),
  offset: (((Number(arg("to", 334)) - Number(arg("from", 196))) % 360) + 360) % 360,
  blacken: args.includes("--blacken"),
  // Rasterised edges of a logo are near-white blues that have to follow the theme,
  // so pixels are compared against a lower chroma floor than the stylesheets use.
  minChroma: Number(arg("chroma", 0.02)),
};

const crcTable = Array.from({ length: 256 }, (_, i) => {
  let c = i;
  for (let bit = 0; bit < 8; bit += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function chunk(type, data) {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(data.length, 0);
  header.write(type, 4, "ascii");
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(Buffer.concat([header.subarray(4), data])), 0);
  return Buffer.concat([header, data, tail]);
}

/** RGBA or RGB pixels, top to bottom, with the per-scanline filters undone. */
function unfilter(raw, width, height, channels) {
  const stride = width * channels;
  const out = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const from = y * (stride + 1) + 1;
    const line = out.subarray(y * stride, (y + 1) * stride);
    const prev = y === 0 ? null : out.subarray((y - 1) * stride, y * stride);
    for (let x = 0; x < stride; x += 1) {
      const rawByte = raw[from + x];
      const left = x >= channels ? line[x - channels] : 0;
      const up = prev ? prev[x] : 0;
      const upLeft = prev && x >= channels ? prev[x - channels] : 0;
      let value;
      if (filter === 0) value = rawByte;
      else if (filter === 1) value = rawByte + left;
      else if (filter === 2) value = rawByte + up;
      else if (filter === 3) value = rawByte + ((left + up) >> 1);
      else {
        const p = left + up - upLeft;
        const pl = Math.abs(p - left);
        const pu = Math.abs(p - up);
        const pp = Math.abs(p - upLeft);
        value = rawByte + (pl <= pu && pl <= pp ? left : pu <= pp ? up : upLeft);
      }
      line[x] = value & 0xff;
    }
  }
  return out;
}

for (const file of files) {
  const buffer = readFileSync(file);
  if (buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error(`${file} is not a PNG`);
  let width = 0;
  let height = 0;
  let colorType = 0;
  let bitDepth = 0;
  let interlace = 0;
  const idat = [];
  for (let offset = 8; offset < buffer.length; ) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") idat.push(data);
    offset += 12 + length;
  }
  if (bitDepth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
    console.log(`${file}: skipped (depth ${bitDepth}, colorType ${colorType}, interlace ${interlace})`);
    continue;
  }
  const channels = colorType === 6 ? 4 : 3;
  const pixels = unfilter(inflateSync(Buffer.concat(idat)), width, height, channels);
  let rotated = 0;
  for (let i = 0; i < pixels.length; i += channels) {
    if (channels === 4 && pixels[i + 3] === 0) continue;
    const next = shiftRgb([pixels[i], pixels[i + 1], pixels[i + 2]], options);
    if (!next) continue;
    pixels[i] = next[0];
    pixels[i + 1] = next[1];
    pixels[i + 2] = next[2];
    rotated += 1;
  }
  const stride = width * channels;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = colorType;
  writeFileSync(file, Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]));
  console.log(`${file}: ${rotated} of ${width * height} pixels recoloured`);
}
