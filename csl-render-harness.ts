import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CsLabs from "./__csl_probe";

const g = globalThis;
g.__CSL_T = "cpu-scheduling";
g.__CSL_I = 0;
g.__CSL_A = "fcfs";

const origWarn = console.warn;
const origError = console.error;

export function mount(topic, index, algo, key) {
  g.__CSL_T = topic;
  g.__CSL_I = index;
  g.__CSL_A = algo;
  const noise = [];
  console.warn = (...a) => noise.push(String(a[0]));
  console.error = (...a) => noise.push(String(a[0]));
  let html = "";
  let failure = null;
  try {
    html = renderToStaticMarkup(createElement(CsLabs, { key }));
  } catch (e) {
    failure = String(e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e);
  }
  console.warn = origWarn;
  console.error = origError;
  return { html, failure, noise: noise.filter((n) => !/useLayoutEffect|not supported in the server/.test(n)) };
}

export function frameCount(topic, algo) {
  g.__CSL_T = topic;
  g.__CSL_I = 0;
  g.__CSL_A = algo;
  const { html } = mount(topic, 0, algo, "count-" + topic + algo);
  const m = html.match(/of (\d+)/);
  return m ? Number.parseInt(m[1], 10) : 0;
}
