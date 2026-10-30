import { useEffect, useRef, useState } from "react";
import { moodProfiles, type MentorMood } from "./mentor-mood";
import { mouthLevel } from "./mentor-voice";

type GuruFaceProps = {
  mood: MentorMood;
  speaking: boolean;
  moodLabel: string;
  className?: string;
};

const JAW_MAX = 15;

type Pose = {
  browAngle: number;
  browLift: number;
  mouthCurve: number;
  mouthWidth: number;
  eyeOpen: number;
  blush: number;
  headTilt: number;
};

const poseKeys: Array<keyof Pose> = ["browAngle", "browLift", "mouthCurve", "mouthWidth", "eyeOpen", "blush", "headTilt"];

function poseOf(mood: MentorMood): Pose {
  const profile = moodProfiles[mood];
  return {
    browAngle: profile.browAngle,
    browLift: profile.browLift,
    mouthCurve: profile.mouthCurve,
    mouthWidth: profile.mouthWidth,
    eyeOpen: profile.eyeOpen,
    blush: profile.blush,
    headTilt: profile.headTilt,
  };
}

function rgbOf(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
}

// One animation loop owns everything that must not snap: the expression eases
// into the new mood over a few hundred milliseconds, the chest breathes, and the
// head nods on its own instead of sitting frozen between words.
export default function GuruFace({ mood, speaking, moodLabel, className }: GuruFaceProps) {
  const profile = moodProfiles[mood];
  const [jaw, setJaw] = useState(0);
  const [blink, setBlink] = useState(false);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [pose, setPose] = useState<Pose>(() => poseOf(mood));
  const [glow, setGlow] = useState(profile.glow);
  const [breath, setBreath] = useState(0);
  const [nod, setNod] = useState(0);
  const raf = useRef<number | null>(null);
  const targetMood = useRef<MentorMood>(mood);
  const nodAt = useRef(-1e9);

  useEffect(() => {
    targetMood.current = mood;
    if (mood === "proud" || mood === "happy" || mood === "laugh") nodAt.current = performance.now();
  }, [mood]);

  useEffect(() => {
    let alive = true;
    let smooth = 0;
    let live = poseOf(targetMood.current);
    let liveGlow = rgbOf(moodProfiles[targetMood.current].glow);
    const tick = (time: number) => {
      if (!alive) return;
      const wanted = poseOf(targetMood.current);
      const wantedGlow = rgbOf(moodProfiles[targetMood.current].glow);
      // Mood changes are never allowed to pop — a real face arrives at a feeling.
      const ease = 0.12;
      live = { ...live };
      for (const key of poseKeys) live[key] += (wanted[key] - live[key]) * ease;
      liveGlow = [
        liveGlow[0] + (wantedGlow[0] - liveGlow[0]) * ease,
        liveGlow[1] + (wantedGlow[1] - liveGlow[1]) * ease,
        liveGlow[2] + (wantedGlow[2] - liveGlow[2]) * ease,
      ];
      const target = speaking ? mouthLevel(time) : 0;
      smooth += (target - smooth) * 0.35;
      const since = time - nodAt.current;
      const nodNow = since < 900 ? Math.exp(-since / 260) * Math.sin(since / 95) * 5 : 0;
      setJaw(smooth);
      setPose(live);
      setGlow(`rgb(${liveGlow.map((channel) => Math.round(channel)).join(" ")})`);
      setBreath(Math.sin((time / 1000) * 1.05) * 0.5 + 0.5);
      setNod(nodNow);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      alive = false;
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [speaking]);

  useEffect(() => {
    let timeout: number;
    let second: number;
    const scheduleBlink = () => {
      timeout = window.setTimeout(() => {
        setBlink(true);
        // A quarter of blinks come in pairs, which is the cheapest thing that
        // makes an SVG face read as alive rather than as a sticker.
        const paired = Math.random() < 0.25;
        const reopen = () => {
          setBlink(false);
          if (paired) second = window.setTimeout(() => {
            setBlink(true);
            window.setTimeout(() => setBlink(false), 90);
          }, 220);
        };
        window.setTimeout(reopen, 120);
        scheduleBlink();
      }, 2200 + Math.random() * 3400);
    };
    scheduleBlink();
    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(second);
    };
  }, []);

  useEffect(() => {
    let interval: number;
    const dart = () => {
      const amplitude = speaking ? 2.6 : 1.6;
      setGaze({ x: (Math.random() - 0.5) * 2 * amplitude, y: (Math.random() - 0.5) * 2 * amplitude * 0.6 });
      // Thinking looks away from the student; pride and laughter come back to them.
      if (targetMood.current === "think") setGaze({ x: -3.4, y: -1.2 });
      else if (targetMood.current === "laugh") setGaze({ x: 0, y: 1.4 });
    };
    dart();
    interval = window.setInterval(dart, 1900);
    return () => window.clearInterval(interval);
  }, [speaking]);

  const curve = pose.mouthCurve * 13;
  const halfWidth = 30 * pose.mouthWidth + 6;
  const open = jaw * JAW_MAX + (profile.mouthCurve < 0 ? 1.2 : 0);
  const cornerY = -curve * 0.55;
  const mouthPath = `M ${-halfWidth} ${cornerY} Q 0 ${open + curve * 0.5} ${halfWidth} ${cornerY} Q 0 ${-open * 0.28 - curve * 0.35} ${-halfWidth} ${cornerY} Z`;
  const eyeSquint = blink ? 0.08 : pose.eyeOpen;
  const browY = -26 - pose.browLift;
  const lidY = -8;

  return (
    <div className={`guru-face${className ? ` ${className}` : ""}`} data-mood={mood} style={{ ["--guru-glow" as string]: glow }}>
      <div className="guru-face-3d" style={{ transform: `translateY(${-breath * 1.4 + nod * 0.4}px) rotateY(${gaze.x * 1.6}deg) rotateX(${-gaze.y * 1.2 + nod}deg) rotate(${pose.headTilt}deg)` }}>
        <svg viewBox="-70 -80 140 160" className="guru-face-svg" role="img" aria-label={`Guru is ${moodLabel}`}>
          <defs>
            <radialGradient id="guru-head" cx="35%" cy="22%" r="88%">
              <stop offset="0%" stopColor="#24374f" />
              <stop offset="45%" stopColor="#16233a" />
              <stop offset="100%" stopColor="#0a1220" />
            </radialGradient>
            <radialGradient id="guru-cheek" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="guru-lip" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#20304a" />
              <stop offset="100%" stopColor="#08101c" />
            </linearGradient>
            <filter id="guru-halo" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>
          <ellipse className="guru-halo" cx="0" cy="-4" rx="62" ry="66" fill={glow} opacity={0.2 + breath * 0.05} filter="url(#guru-halo)" />
          <path d="M -8 -74 Q 0 -86 8 -74" stroke={glow} strokeWidth="5" strokeLinecap="round" fill="none" />
          <rect x="-52" y="-66" width="104" height="118" rx="42" fill="url(#guru-head)" stroke="#243449" strokeWidth="2.5" />
          <ellipse cx="-14" cy="-44" rx="30" ry="18" fill="url(#guru-cheek)" />
          <ellipse cx="-54" cy="0" rx="7" ry="11" fill="#131f33" stroke="#243449" strokeWidth="2" />
          <ellipse cx="54" cy="0" rx="7" ry="11" fill="#131f33" stroke="#243449" strokeWidth="2" />
          <g className="guru-brows" stroke="#e8eff9" strokeWidth="5" strokeLinecap="round" fill="none">
            <path d={`M -34 ${browY} L -12 ${browY - pose.browAngle * 0.55}`} />
            <path d={`M 12 ${browY - pose.browAngle * 0.55} L 34 ${browY}`} />
          </g>
          <g className="guru-eyes">
            {[-23, 23].map((x) => (
              <g key={x} transform={`translate(${x} ${lidY}) scale(1 ${Math.max(0.08, eyeSquint)})`}>
                <ellipse cx="0" cy="0" rx="13" ry="12" fill="#e8eff9" opacity="0.94" />
                <circle className="guru-pupil" cx={gaze.x} cy={gaze.y} r="6" fill="#0a1220" />
                <circle cx={gaze.x} cy={gaze.y} r="2.6" fill="#1f3a5c" />
                <circle className="guru-spark" cx={gaze.x - 2} cy={gaze.y - 2.4} r="1.8" fill="#ffffff" />
                <path d="M -12 -4 Q 0 -12 12 -4" stroke="#0a1220" strokeWidth={blink ? 3 : 1.4} fill="none" strokeLinecap="round" opacity="0.55" />
              </g>
            ))}
          </g>
          <g className="guru-glasses" fill="none" stroke={glow} strokeWidth="2.4" opacity="0.85">
            <circle cx="-23" cy="-8" r="17" />
            <circle cx="23" cy="-8" r="17" />
            <path d="M -6 -8 L 6 -8" />
            <path d="M -40 -12 L -52 -8" />
            <path d="M 40 -12 L 52 -8" />
          </g>
          {[-30, 30].map((x) => (
            <ellipse key={x} className="guru-blush" cx={x} cy="16" rx="10" ry="6" fill="#f87171" opacity={pose.blush * 0.55} />
          ))}
          <path d="M 0 6 L -3 16 L 3 16" stroke="#3b5173" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <g transform="translate(0 32)">
            <path d={mouthPath} fill="url(#guru-lip)" stroke={mood === "angry" ? "#f87171" : "#60a5fa"} strokeWidth="2.2" strokeLinejoin="round" />
            {open > 3 && <rect x={-halfWidth * 0.62} y={cornerY - 0.6} width={halfWidth * 1.24} height={Math.min(4, open * 0.34)} rx="1.4" fill="#e8eff9" opacity="0.9" />}
            {open > 5 && <ellipse cx="0" cy={open * 0.55} rx={halfWidth * 0.42} ry={open * 0.3} fill="#e0596b" opacity="0.85" />}
            <path d={`M ${-halfWidth} ${cornerY} Q 0 ${cornerY - 5 - pose.mouthCurve * 3} ${halfWidth} ${cornerY}`} stroke="#3b5173" strokeWidth="1.6" fill="none" opacity="0.7" />
          </g>
          <path d="M -20 56 Q 0 64 20 56" stroke="#243449" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M -26 46 Q -30 38 -26 30" stroke="#1d2f4c" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
          <path d="M 26 46 Q 30 38 26 30" stroke="#1d2f4c" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
        </svg>
      </div>
      <span className="guru-mood-chip" data-mood={mood}>{moodLabel}</span>
    </div>
  );
}
