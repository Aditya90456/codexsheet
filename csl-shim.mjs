const noop = () => {};
const synth = { getVoices: () => [], onvoiceschanged: null, speaking: false, pending: false, cancel: noop, resume: noop, pause: noop, speak: noop };
const root = { dataset: {}, style: {}, lang: "", setAttribute: noop };
globalThis.window = globalThis.window || globalThis;
globalThis.speechSynthesis = synth;
try {
  Object.defineProperty(globalThis, "navigator", { value: { language: "en-IN" }, configurable: true });
} catch {
  /* node already exposes a read-only navigator */
}globalThis.document = { documentElement: root, createElement: () => ({ style: {}, setAttribute: noop }), body: { appendChild: noop } };
globalThis.setTimeout = setTimeout;
globalThis.clearTimeout = clearTimeout;
globalThis.SpeechSynthesisUtterance = function () { return { setAttribute: noop }; };
globalThis.window.speechSynthesis = synth;
globalThis.window.setTimeout = setTimeout;
globalThis.window.clearTimeout = clearTimeout;
globalThis.window.addEventListener = noop;
globalThis.window.removeEventListener = noop;
globalThis.window.document = globalThis.document;
