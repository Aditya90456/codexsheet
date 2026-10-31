// Scratch: rasterise the CodexSheet mark to PNG without a browser or image lib.
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const crcTable = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const writePng = (path, size, pixels) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  writeFileSync(path, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]));
};

const U = 88;
const hex = (value) => [parseInt(value.slice(1, 3), 16), parseInt(value.slice(3, 5), 16), parseInt(value.slice(5, 7), 16)];
const BLUE_TOP = hex("#3B82F6");
const BLUE_BOTTOM = hex("#1D4ED8");
const DEEP = hex("#1D4ED8");
const MID = hex("#3B82F6");
const WHITE = [255, 255, 255];
const GREEN = hex("#34D399");

const inRounded = (x, y, box, radius) => {
  const [x0, y0, x1, y1] = box;
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const r = Math.min(radius, (x1 - x0) / 2, (y1 - y0) / 2);
  if (x >= x0 + r && x <= x1 - r) return true;
  if (y >= y0 + r && y <= y1 - r) return true;
  const cx = x < x0 + r ? x0 + r : x1 - r;
  const cy = y < y0 + r ? y0 + r : y1 - r;
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};

const DOTS = [
  { box: [28, 35, 37, 44], color: DEEP },
  { box: [51, 35, 60, 44], color: DEEP },
  { box: [28, 57, 37, 66], color: DEEP },
  { box: [51, 57, 60, 66], color: DEEP },
  { box: [39.5, 46, 48.5, 55], color: MID },
];

const gradient = (x, y) => {
  const t = Math.min(1, Math.max(0, (x + y) / (U * 2)));
  return BLUE_TOP.map((value, i) => Math.round(value + (BLUE_BOTTOM[i] - value) * t));
};

const layerAt = (x, y, fullBleed) => {
  for (const dot of DOTS) if (inRounded(x, y, dot.box, 2.5)) return dot.color;
  if (!fullBleed && inRounded(x, y, [52, 15, 67, 30], 4)) return GREEN;
  if (inRounded(x, y, fullBleed ? [14, 10, 74, 78] : [21, 15, 67, 73], 8)) return WHITE;
  if (fullBleed) return gradient(x, y);
  return inRounded(x, y, [0, 0, 88, 88], 22) ? gradient(x, y) : null;
};

const render = (path, size, options = {}) => {
  const { fullBleed = false, scale = 1 } = options;
  const window = U / scale;
  const offset = (window - U) / 2;
  const buffer = Buffer.alloc(size * size * 4);
  const samples = 4;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let hits = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const x = offset + ((px + (sx + 0.5) / samples) / size) * window;
          const y = offset + ((py + (sy + 0.5) / samples) / size) * window;
          const color = layerAt(x, y, fullBleed);
          if (!color) continue;
          r += color[0];
          g += color[1];
          b += color[2];
          hits++;
        }
      }
      const at = (py * size + px) * 4;
      const total = samples * samples;
      buffer[at] = hits ? Math.round(r / hits) : 0;
      buffer[at + 1] = hits ? Math.round(g / hits) : 0;
      buffer[at + 2] = hits ? Math.round(b / hits) : 0;
      buffer[at + 3] = Math.round((hits / total) * 255);
    }
  }
  writePng(path, size, buffer);
  return path;
};

const targets = [
  ["public/favicon-16.png", 16, {}],
  ["public/favicon-32.png", 32, {}],
  ["public/favicon-48.png", 48, {}],
  ["public/apple-touch-icon.png", 180, { fullBleed: true, scale: 0.78 }],
  ["public/icon-192.png", 192, {}],
  ["public/icon-512.png", 512, {}],
  ["public/maskable-512.png", 512, { fullBleed: true, scale: 0.62 }],
];

for (const [path, size, options] of targets) console.log("wrote", render(path, size, options), size);
