// LessonVideoRail.tsx — the Love Babbar lessons that sit under the 250-problem
// sheet. One row per lecture of the real CodeHelp placement series, each opening
// in the player on this page instead of the old playlist block that pointed
// somewhere else. Free: nothing here is behind the ₹10 pass, and the
// player stays empty until a lecture is picked, so YouTube loads nothing on its
// own.
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ExternalLink, Play } from "lucide-react";
import type { Problem } from "./dsaSheet";
import { topics } from "./dsaSheet";
import { embedUrl, lessonHours, lessonLectures, lessonVideos, watchUrl, youTubeChannel, type LessonVideo } from "./love-babbar-lessons";
import { videoVoice } from "./sheetVoice";

type Props = {
  problems: Problem[];
  /** The sheet's current pattern filter, so the rail lands where the student is. */
  pattern: string;
  /** The sheet is what the rail sits under; when it is still locked there is
   * no problem list to jump into. */
  sheetLocked: boolean;
  onOpenTopic: (topic: string) => void;
};

const ROWS_BEFORE_MORE = 40;

const isBasics = (video: LessonVideo) => !video.topic;

export default function LessonVideoRail({ problems, pattern, sheetLocked, onOpenTopic }: Props) {
  const [topic, setTopic] = useState<string>("all");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [shown, setShown] = useState(ROWS_BEFORE_MORE);
  const playerRef = useRef<HTMLDivElement | null>(null);

  const lectures = lessonLectures;

  // How many sheet rows each topic actually has - the rail quotes the sheet, not a
  // promise, when it says a lecture has problems to solve.
  const topicCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const problem of problems) counts.set(problem.topic, (counts.get(problem.topic) ?? 0) + 1);
    return counts;
  }, [problems]);

  const patternTopic = useMemo(() => problems.find((problem) => problem.pattern === pattern)?.topic ?? null, [problems, pattern]);

  // Landing where the sheet is filtered means a student who picked "Graphs" gets
  // the graph lectures first, without hunting for them.
  useEffect(() => {
    if (patternTopic) setTopic(patternTopic);
  }, [patternTopic]);

  const list = useMemo(() => {
    if (topic === "all") return lectures;
    if (topic === "basics") return lectures.filter(isBasics);
    return lectures.filter((video) => video.topic === topic);
  }, [lectures, topic]);

  const current = videoId ? lectures.find((video) => video.videoId === videoId) ?? null : null;
  const position = current ? list.findIndex((video) => video.videoId === current.videoId) : -1;

  const pick = (video: LessonVideo) => {
    setVideoId(video.videoId);
    setStarted(true);
    playerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const step = (delta: number) => {
    const next = list[(position + delta + list.length) % list.length];
    if (next) pick(next);
  };

  const chipFor = (label: string, value: string, count: number) => (
    <button key={value} type="button" className={`lesson-video-chip${topic === value ? " active" : ""}`} onClick={() => { setTopic(value); setShown(ROWS_BEFORE_MORE); }}>
      {label}<small>{count}</small>
    </button>
  );

  return (
    <section className="lesson-videos" aria-label="Free Love Babbar video lessons">
      <header className="lesson-video-head">
        <div>
          <span className="lesson-video-eyebrow"><Play size={12}/> {videoVoice.eyebrow}</span>
          <h2>{videoVoice.heading(lectures.length, lessonHours)} <em>{videoVoice.headingTail}</em></h2>
          <p>{videoVoice.body(topics.length, youTubeChannel)}</p>
        </div>
        <span className="lesson-video-free">{videoVoice.free}</span>
      </header>

      <div className="lesson-video-filters">
        {chipFor(videoVoice.filterAll, "all", lectures.length)}
        {topics.map((name) => chipFor(name, name, lectures.filter((video) => video.topic === name).length))}
        {chipFor(videoVoice.basicsLabel, "basics", lectures.filter(isBasics).length)}
      </div>

      <div className="lesson-video-layout">
        <div className="lesson-video-player" ref={playerRef}>
          {current && started ? (
            <div className="lesson-video-frame">
              <iframe
                key={current.videoId}
                src={`${embedUrl(current.videoId)}&autoplay=1`}
                title={`Lecture ${current.lecture}: ${current.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ) : current ? (
            <button type="button" className="lesson-video-poster" onClick={() => setStarted(true)}>
              <img src={`https://i.ytimg.com/vi/${current.videoId}/hqdefault.jpg`} alt="" loading="lazy" />
              <span className="lesson-video-poster-play"><Play size={20}/></span>
              <span className="lesson-video-poster-note">{videoVoice.play}</span>
            </button>
          ) : (
            <div className="lesson-video-idle">
              <Play size={22}/>
              <strong>{videoVoice.pickPrompt}</strong>
              {list[0] && (
                <button type="button" onClick={() => pick(list[0])}>
                  <Play size={12}/> {videoVoice.playFirst(topic === "all" ? videoVoice.filterAll : topic === "basics" ? videoVoice.basicsLabel : topic)}
                </button>
              )}
            </div>
          )}

          {current && (
            <div className="lesson-video-now">
              <span className="lesson-video-now-label">{videoVoice.nowPlaying}</span>
              <strong>{current.title}</strong>
              <span className="lesson-video-now-meta">
                {videoVoice.lessonLabel(current.lecture)} · {current.runtime}
                {position >= 0 ? ` · ${position + 1}/${list.length}` : ""}
                {current.patternLabel ? ` · ${current.patternLabel}` : ""}
              </span>
              <div className="lesson-video-actions">
                <button type="button" onClick={() => step(-1)} disabled={list.length < 2}>{videoVoice.prevLesson}</button>
                <button type="button" onClick={() => step(1)} disabled={list.length < 2}>{videoVoice.nextLesson}</button>
                <a href={watchUrl(current.videoId)} target="_blank" rel="noreferrer">{videoVoice.openYouTube} <ExternalLink size={12}/></a>
                {!sheetLocked && current.topic && (topicCounts.get(current.topic) ?? 0) > 0 && (
                  <button type="button" className="lesson-video-jump" onClick={() => onOpenTopic(current.topic ?? "")}>
                    {videoVoice.sheetJump(topicCounts.get(current.topic) ?? 0, current.topic)} <ChevronDown size={12}/>
                  </button>
                )}
              </div>
            </div>
          )}
          <p className="lesson-video-privacy">{videoVoice.privacy}</p>
        </div>

        <div className="lesson-video-list">
          {list.slice(0, shown).map((video) => (
            <button
              key={video.videoId}
              type="button"
              className={`lesson-video-row${video.videoId === videoId ? " active" : ""}${video.patterns.includes(pattern) ? " matched" : ""}`}
              onClick={() => pick(video)}
            >
              <span className="lesson-video-row-no">{video.lecture ? String(video.lecture).padStart(3, "0") : "•"}</span>
              <span className="lesson-video-row-title">
                {video.title}
                <small>{video.topic ?? video.patternLabel}</small>
              </span>
              {/* The cell is always there so the runtime and the glyph line up in
                  every row, matched or not. */}
              <span>{video.patterns.includes(pattern) && <span className="lesson-video-row-flag">{videoVoice.matched}</span>}</span>
              <span className="lesson-video-row-time">{video.runtime}</span>
              <span className="lesson-video-row-play"><Play size={13}/></span>
            </button>
          ))}
          {shown < list.length && (
            <button type="button" className="lesson-video-more" onClick={() => setShown(list.length)}>
              {videoVoice.showAll(list.length)} <ChevronDown size={13}/>
            </button>
          )}
          <p className="lesson-video-foot">{videoVoice.totalNote(lessonHours, lectures.length, lessonVideos.length - lectures.length)}</p>
        </div>
      </div>
    </section>
  );
}
