// Guru speaks. Web Speech API is the only voice a student on a ₹5,000 Android
// phone already has, so there is no audio file and no paid API behind it — the
// mouth level below is what makes the face look like it is really talking.
import { languageSpeechName, type UiLanguage } from "./i18n";
import { moodProfiles, type MentorMood } from "./mentor-mood";

export type SpeakOptions = { lang: UiLanguage; mood: MentorMood; onWord?: (word: string) => void; onEnd?: () => void };

export const voiceSupported = typeof window !== "undefined" && "speechSynthesis" in window;

let voices: SpeechSynthesisVoice[] = [];
let currentWord = "";
let mouthPeak = 0;
let generation = 0;
const stateListeners = new Set<(speaking: boolean) => void>();

function refreshVoices() {
  if (!voiceSupported) return;
  voices = window.speechSynthesis.getVoices();
}

if (voiceSupported) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

export function pickVoice(lang: UiLanguage): SpeechSynthesisVoice | null {
  if (!voiceSupported) return null;
  if (!voices.length) refreshVoices();
  const locale = `${lang}-IN`.toLowerCase();
  const wanted = languageSpeechName[lang].split(" (")[0].toLowerCase();
  return (
    voices.find((voice) => voice.lang.replace("_", "-").toLowerCase() === locale) ??
    voices.find((voice) => voice.name.toLowerCase().includes(wanted)) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(lang.toLowerCase())) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en-in")) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ??
    null
  );
}

export function hasNativeVoice(lang: UiLanguage): boolean {
  const voice = voiceSupported ? pickVoice(lang) : null;
  return Boolean(voice && voice.lang.toLowerCase().startsWith(lang.toLowerCase()));
}

/** Markdown, code blocks and diagram JSON would be read out as noise. */
export function speechText(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, " There is code for this — I will put it on the board. ")
    .replace(/```[a-z]*\s*/gi, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[mood:[a-z]+\]/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/[*_#>|~-]+/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toChunks(text: string): string[] {
  const parts = text.match(/[^.!?。！？\n]+[.!?。!?]?/g) ?? [text];
  const out: string[] = [];
  for (const part of parts) {
    let chunk = part.trim();
    if (!chunk) continue;
    while (chunk.length > 220) {
      const cut = chunk.lastIndexOf(" ", 220);
      out.push(chunk.slice(0, cut > 60 ? cut : 220).trim());
      chunk = chunk.slice(cut > 60 ? cut : 220).trim();
    }
    if (chunk) out.push(chunk);
  }
  return out.slice(0, 30);
}

let speaking = false;

function announce(next: boolean) {
  if (speaking === next) return;
  speaking = next;
  stateListeners.forEach((listener) => listener(next));
}

export function onVoiceStateChange(listener: (next: boolean) => void): () => void {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

export function isSpeaking(): boolean {
  return speaking;
}

function finish() {
  generation += 1;
  currentWord = "";
  mouthPeak = 0;
  announce(false);
}

export function speak(raw: string, options: SpeakOptions): boolean {
  if (!voiceSupported) return false;
  const text = speechText(raw);
  if (!text) return false;
  const chunks = toChunks(text);
  if (!chunks.length) return false;

  // Chrome ignores a speak() issued in the same tick as cancel(), so a restart
  // waits for the engine to actually come back idle.
  const busy = window.speechSynthesis.speaking || window.speechSynthesis.pending;
  finish();
  if (busy) window.speechSynthesis.cancel();

  const profile = moodProfiles[options.mood];
  const voice = pickVoice(options.lang);
  const token = generation;
  let ended = 0;

  const utterances = chunks.map((chunk) => {
    const utterance = new SpeechSynthesisUtterance(chunk);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = `${options.lang}-IN`;
    }
    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;
    utterance.volume = 1;
    utterance.onstart = () => {
      if (token !== generation) return;
      mouthPeak = 1;
    };
    utterance.onboundary = (event) => {
      if (token !== generation) return;
      if (event.name && event.name !== "word") return;
      const word = utterance.text.slice(event.charIndex, event.charIndex + (event.charLength || 12)).trim();
      if (!word) return;
      currentWord = word;
      mouthPeak = 1;
      options.onWord?.(word);
    };
    const settle = () => {
      if (token !== generation) return;
      ended += 1;
      if (ended < chunks.length) {
        mouthPeak = 0.25;
        return;
      }
      finish();
      options.onEnd?.();
    };
    utterance.onend = settle;
    utterance.onerror = settle;
    return utterance;
  });

  const enqueue = () => {
    if (token !== generation) return;
    announce(true);
    // Handing the whole list to the engine is what removes the gap between
    // sentences — the queue is filled by the OS, not by a callback round-trip.
    window.speechSynthesis.resume();
    for (const utterance of utterances) window.speechSynthesis.speak(utterance);
  };

  if (busy) window.setTimeout(enqueue, 90);
  else enqueue();
  return true;
}

export function stopSpeaking() {
  if (!voiceSupported) return;
  finish();
  window.speechSynthesis.cancel();
}

/**
 * 0..1 jaw opening. A boundary event spikes the peak and it decays, so the mouth
 * still moves on voices that never fire boundary events.
 */
export function mouthLevel(time: number): number {
  if (!speaking) return 0;
  const wave = Math.abs(Math.sin((time / 1000) * 9.2)) * 0.55 + Math.abs(Math.sin((time / 1000) * 3.1)) * 0.35;
  return Math.max(0.12, Math.min(1, wave * (0.65 + mouthPeak * 0.35)));
}

export function currentSpokenWord(): string {
  return currentWord;
}
