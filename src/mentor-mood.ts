// Guru's feelings are not decoration: the mood decides how the face is drawn,
// how fast and high the voice speaks, and how long each board step stays up.
// The hosted model can ask for a mood with a leading `[mood:laugh]` cue, and if
// it does not, the detector below reads it from the words themselves.
export type MentorMood = "calm" | "happy" | "laugh" | "angry" | "think" | "proud";

export type MoodProfile = {
  label: string;
  browAngle: number;
  browLift: number;
  mouthCurve: number;
  mouthWidth: number;
  eyeOpen: number;
  blush: number;
  headTilt: number;
  glow: string;
  rate: number;
  pitch: number;
  stepSeconds: number;
};

export const moodProfiles: Record<MentorMood, MoodProfile> = {
  calm: { label: "calm", browAngle: 0, browLift: 0, mouthCurve: 0.22, mouthWidth: 0.62, eyeOpen: 1, blush: 0, headTilt: -2, glow: "#3b82f6", rate: 0.95, pitch: 0.98, stepSeconds: 6.5 },
  happy: { label: "smiling", browAngle: -4, browLift: 2, mouthCurve: 0.72, mouthWidth: 0.74, eyeOpen: 0.86, blush: 0.35, headTilt: 3, glow: "#60a5fa", rate: 1.04, pitch: 1.12, stepSeconds: 6 },
  laugh: { label: "laughing", browAngle: -8, browLift: 4, mouthCurve: 1, mouthWidth: 0.9, eyeOpen: 0.34, blush: 0.75, headTilt: 6, glow: "#fbbf24", rate: 1.14, pitch: 1.32, stepSeconds: 5 },
  angry: { label: "annoyed", browAngle: 16, browLift: -3, mouthCurve: -0.5, mouthWidth: 0.5, eyeOpen: 0.78, blush: 0, headTilt: -6, glow: "#f87171", rate: 1.22, pitch: 0.82, stepSeconds: 5.5 },
  think: { label: "thinking", browAngle: -10, browLift: 3, mouthCurve: 0.05, mouthWidth: 0.42, eyeOpen: 0.92, blush: 0, headTilt: 8, glow: "#a78bfa", rate: 0.86, pitch: 0.94, stepSeconds: 7.5 },
  proud: { label: "proud of you", browAngle: -6, browLift: 4, mouthCurve: 0.86, mouthWidth: 0.8, eyeOpen: 0.9, blush: 0.5, headTilt: -4, glow: "#34d399", rate: 1.02, pitch: 1.2, stepSeconds: 6 },
};

export const mentorMoods = Object.keys(moodProfiles) as MentorMood[];

const cuePattern = /^\s*\[mood[:\s-]([a-z]+)\]\s*/i;

/** Split the model's mood cue off the reply so it never reaches the student. */
export function parseMoodCue(text: string): { mood: MentorMood | null; text: string } {
  const match = cuePattern.exec(text);
  if (!match) return { mood: null, text };
  const raw = match[1].toLowerCase();
  const mood = mentorMoods.find((candidate) => candidate === raw);
  return { mood: mood ?? null, text: text.slice(match[0].length) };
}

const angryCues = ["skip", "skipping", "same mistake", "you did not", "didn't do", "ignore the", "छोड़", "छोड", "ध्यान नहीं", "এড়িয়ে"];
const laughCues = ["haha", "lol", "😂", "funny", "joke", "silly", "hasi", "हंस", "हास्य", "சிரிப்பு", "నవ్వు", "હાસ્ય"];
const proudCues = ["you got it", "nailed", "correct", "solved", "accepted", "right answer", "well done", "सही", "ঠিক", "சரி", "సరైన", "સાચું"];
const stuckCues = ["can't", "cannot", "no idea", "confused", "stuck", "help", "hard", "difficult", "samajh", "समझ नहीं", "बुझ", "পারছি না", "புரிய", "అర్థం", "સમજ"];

function hasAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

/**
 * Fallback mood when the model stayed silent about feelings. Repeating the same
 * question is the one thing worth a frown — everything else stays warm.
 */
export function detectMood(reply: string, studentText: string, repeatCount: number): MentorMood {
  const replyText = reply.toLowerCase();
  const student = studentText.toLowerCase();
  if (repeatCount >= 3 && hasAny(student, ["hint", "solve", "answer", "उत्तर"])) return "angry";
  if (hasAny(replyText, laughCues) || hasAny(student, laughCues)) return "laugh";
  if (hasAny(replyText, proudCues) || hasAny(student, ["got it", "i did it", "हो गया"])) return "proud";
  if (hasAny(replyText, angryCues)) return "angry";
  if (hasAny(student, stuckCues)) return "think";
  if (hasAny(replyText, ["good", "nice", "great", "exactly", "बढ़िया", "ভালো", "நல்ல", "మంచి", "સારો"])) return "happy";
  return "calm";
}
