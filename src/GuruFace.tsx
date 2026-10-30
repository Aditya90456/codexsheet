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

/**
 * One SVG head, six expressions. Everything animated here is state driven, so
 * the face stays cheap on a low-end phone and still matches the spoken word.
 */
export default function GuruFace({ mood, speaking, moodLabel, className }: GuruFaceProps) {
  const profile = moodProfiles[mood];
  const [jaw, setJaw] = useState(0);
  const [blink, setBlink] = useState(false);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    let smooth = 0;
    const tick = (time: number) => {
      if (!alive) return;
      const target = speaking ? mouthLevel(time) : 0;
      smooth += (target - smooth) * 0.35;
      setJaw(smooth);
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
    const scheduleBlink = () => {
      timeout = window.setTimeout(() => {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 120);
        scheduleBlink();
      }, 2200 + Math.random() * 3400);
    };
    scheduleBlink();
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let interval: number;
    const dart = () => {
      const amplitude = speaking ? 2.6 : 1.6;
      setGaze({ x: (Math.random() - 0.5) * 2 * amplitude, y: (Math.random() - 0.5) * 2 * amplitude * 0.6 });
    };
    dart();
    interval = window.setInterval(dart, 1900);
    return () => window.clearInterval(interval);
  }, [speaking]);

  const curve = profile.mouthCurve * 13;
  const halfWidth = 30 * profile.mouthWidth + 6;
  const open = jaw * JAW_MAX;
  const cornerY = -curve * 0.55;
  const mouthPath = `M ${-halfWidth} ${cornerY} Q 0 ${open + curve * 0.5} ${halfWidth} ${cornerY} Q 0 ${-open * 0.28 - curve * 0.35} ${-halfWidth} ${cornerY} Z`;
  const eyeSquint = blink ? 0.08 : profile.eyeOpen;
  const browY = -26 - profile.browLift;
  const glow = profile.glow;

  return (
    <div className={`guru-face${className ? ` ${className}` : ""}`} data-mood={mood} style={{ ["--guru-glow" as string]: glow }}>
      <div className="guru-face-3d" style={{ transform: `rotateY(${gaze.x * 1.6}deg) rotateX(${-gaze.y * 1.2}deg) rotate(${profile.headTilt}deg)` }}>
        <svg viewBox="-70 -80 140 160" className="guru-face-svg" role="img" aria-label={`Guru is ${moodLabel}`}>
          <defs>
            <radialGradient id="guru-head" cx="35%" cy="25%" r="85%">
              <stop offset="0%" stopColor="#1d2f4c" />
              <stop offset="60%" stopColor="#131f33" />
              <stop offset="100%" stopColor="#0a1220" />
            </radialGradient>
            <filter id="guru-halo" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>
          <ellipse className="guru-halo" cx="0" cy="-4" rx="62" ry="66" fill={glow} opacity="0.22" filter="url(#guru-halo)" />
          <path d="M -8 -74 Q 0 -86 8 -74" stroke={glow} strokeWidth="5" strokeLinecap="round" fill="none" />
          <rect x="-52" y="-66" width="104" height="118" rx="42" fill="url(#guru-head)" stroke="#243449" strokeWidth="2.5" />
          <ellipse cx="-54" cy="0" rx="7" ry="11" fill="#131f33" stroke="#243449" strokeWidth="2" />
          <ellipse cx="54" cy="0" rx="7" ry="11" fill="#131f33" stroke="#243449" strokeWidth="2" />
          <g className="guru-brows" stroke="#e8eff9" strokeWidth="5" strokeLinecap="round" fill="none">
            <path d={`M -34 ${browY} L -12 ${browY - profile.browAngle * 0.55}`} />
            <path d={`M 12 ${browY - profile.browAngle * 0.55} L 34 ${browY}`} />
          </g>
          <g className="guru-eyes">
            {[-23, 23].map((x) => (
              <g key={x} transform={`translate(${x} ${-8}) scale(1 ${Math.max(0.08, eyeSquint)})`}>
                <ellipse cx="0" cy="0" rx="13" ry="12" fill="#e8eff9" opacity="0.94" />
                <circle className="guru-pupil" cx={gaze.x} cy={gaze.y} r="6" fill="#0a1220" />
                <circle className="guru-spark" cx={gaze.x - 2} cy={gaze.y - 2.4} r="1.8" fill="#ffffff" />
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
            <ellipse key={x} className="guru-blush" cx={x} cy="16" rx="10" ry="6" fill="#f87171" opacity={profile.blush * 0.55} />
          ))}
          <path d="M 0 6 L -3 16 L 3 16" stroke="#3b5173" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <g transform="translate(0 32)">
            <path d={mouthPath} fill="#08101c" stroke={mood === "angry" ? "#f87171" : "#60a5fa"} strokeWidth="2.2" strokeLinejoin="round" />
            {open > 5 && <ellipse cx="0" cy={open * 0.55} rx={halfWidth * 0.42} ry={open * 0.3} fill="#e0596b" opacity="0.85" />}
          </g>
          <path d="M -20 56 Q 0 64 20 56" stroke="#243449" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
        </svg>
      </div>
      <span className="guru-mood-chip" data-mood={mood}>{moodLabel}</span>
    </div>
  );
}
