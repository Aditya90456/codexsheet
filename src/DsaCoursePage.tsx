import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Check, Clock3, Play, Sparkles } from "lucide-react";
import DsaCourseStudio from "./DsaCourseStudio";
import { courseLessons, courseUnits, lessonsForUnit } from "./deva-course-lessons";
import "./dsa-course-page.css";

function readCompletedLessons() {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem("deva-course:done") ?? "[]");
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export default function DsaCoursePage() {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>(readCompletedLessons);
  const completed = useMemo(() => new Set(completedIds), [completedIds]);
  const progress = Math.round((completed.size / Math.max(1, courseLessons.length)) * 100);
  const nextLesson = courseLessons.find((lesson) => !completed.has(lesson.id)) ?? courseLessons[0];

  const returnToCatalog = () => {
    setCompletedIds(readCompletedLessons());
    setSelectedLessonId(null);
  };

  if (selectedLessonId) {
    return (
      <section className="dsa-course-page dsa-course-page-learning" aria-label="DSA course">
        <button type="button" className="dsa-course-back" onClick={returnToCatalog}>
          <ArrowRight size={15} /> Course overview
        </button>
        <DsaCourseStudio initialLessonId={selectedLessonId} showCourseHeader={false} showCurriculum={false} />
      </section>
    );
  }

  return (
    <section className="dsa-course-page" aria-label="DSA course">
      <header className="dsa-course-hero">
        <div className="dsa-course-hero-copy">
          <span className="dsa-course-eyebrow"><Sparkles size={13} /> THE CODEXSHEET DSA COURSE</span>
          <h2>Understand the pattern.<br /><em>Then write the code.</em></h2>
          <p>Learn core algorithms through step-by-step visual walkthroughs, a hands-on editor, and focused practice.</p>
          <button type="button" className="dsa-course-continue" onClick={() => nextLesson && setSelectedLessonId(nextLesson.id)}>
            <Play size={15} fill="currentColor" /> {completed.size ? "Continue learning" : "Start learning"}
            <ArrowRight size={15} />
          </button>
        </div>
        <div className="dsa-course-hero-aside" aria-label="Course information">
          <span>VISUAL, STEP-BY-STEP LESSONS</span>
          <strong>From first principle<br />to working solution.</strong>
          <div className="dsa-course-hero-stats">
            <span><b>{courseUnits.length}</b> units</span>
            <span><b>{courseLessons.length}</b> lessons</span>
          </div>
        </div>
      </header>

      <section className="dsa-course-progress-card" aria-label="Course progress">
        <div className="dsa-course-progress-heading">
          <span><BookOpen size={15} /> YOUR LEARNING PATH</span>
          <strong>{completed.size}<i> / {courseLessons.length} lessons</i></strong>
        </div>
        <div className="dsa-course-progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <small>{progress === 100 ? "You’ve completed the course." : `${progress}% complete · Pick up where you left off whenever you're ready.`}</small>
      </section>

      <div className="dsa-course-catalog-heading">
        <div><span>THE CURRICULUM</span><h3>Choose your next concept</h3></div>
        <span><Clock3 size={14} /> Learn at your own pace</span>
      </div>

      <div className="dsa-course-catalog">
        {courseUnits.map((unit, unitIndex) => {
          const lessons = lessonsForUnit(unit.id);
          const finished = lessons.filter((lesson) => completed.has(lesson.id)).length;
          return (
            <section className="dsa-course-unit-card" key={unit.id}>
              <header>
                <span>UNIT {String(unitIndex + 1).padStart(2, "0")}</span>
                <strong>{unit.title}</strong>
                <small>{finished} / {lessons.length} complete</small>
                <p>{unit.blurb}</p>
              </header>
              <div className="dsa-course-lesson-list">
                {lessons.map((lesson, lessonIndex) => (
                  <button type="button" className="dsa-course-lesson-card" key={lesson.id} onClick={() => setSelectedLessonId(lesson.id)}>
                    <span className={`dsa-course-lesson-number${completed.has(lesson.id) ? " done" : ""}`}>
                      {completed.has(lesson.id) ? <Check size={14} /> : String(lessonIndex + 1).padStart(2, "0")}
                    </span>
                    <span className="dsa-course-lesson-copy">
                      <strong>{lesson.title}</strong>
                      <small>{lesson.goal}</small>
                    </span>
                    <span className="dsa-course-lesson-pattern">{lesson.pattern}</span>
                    <ArrowRight size={15} className="dsa-course-lesson-arrow" />
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
