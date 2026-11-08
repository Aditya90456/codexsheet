// The colour maths behind the theme scripts, shared so a stylesheet and a PNG
// icon are recoloured with exactly the same numbers.
//
// A colour is replaced only when its hue sits inside the source band and it has
// real chroma, which is what keeps greys, white overlays, greens and ambers
// untouched. The band is read from the command line, so the same code moves a
// blue palette to red or back again.
export const hexToRgb = (hex) => {
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

export const rgbToHex = ([r, g, b]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

export function rgbToHsl([r, g, b]) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  let h = 0;
  if (max === rr) h = ((gg - bb) / d) % 6;
  else if (max === gg) h = (bb - rr) / d + 2;
  else h = (rr - gg) / d + 4;
  return { h: (h * 60 + 360) % 360, s: Math.min(s, 1), l };
}

export function hslToRgb({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map((v) => Math.round((v + m) * 255));
}

const chroma = ([r, g, b]) => {
  const max = Math.max(r, g, b);
  return max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
};

/**
 * Returns the rotated colour, or null when the colour is not part of the palette
 * being replaced. `minChroma` is how much colour a pixel has to carry before it is
 * treated as part of the palette: stylesheets keep the default, since a near-white
 * grey in CSS really is a grey, while a rasterised logo has cool antialiased edges
 * that need to go warm with the rest of it.
 * @param {number[]} rgb
 * @param {{from: number, band: number, offset: number, blacken: boolean, minChroma?: number}} options
 */
export function shiftRgb(rgb, { from, band, offset, blacken, minChroma = 0.08 }) {
  const { h, s, l } = rgbToHsl(rgb);
  if (s < 0.03 || chroma(rgb) < minChroma) return null;
  if ((h - from + 360) % 360 >= band) return null;
  let next = { h: (h + offset) % 360, s, l };
  if (blacken && next.l < 0.26) next = { h: next.h, s: Math.max(next.s * 0.55, 0.02), l: Math.max(next.l * 0.55, 0.015) };
  return hslToRgb(next);
}
