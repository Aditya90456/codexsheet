import { ArrowDown, ArrowRight, Braces, Layers3, ScanEye } from "lucide-react";
import { lessonMarkers, type CourseLesson, type LessonStep } from "./deva-course-lessons";
import "./dsa-visualization.css";

type DsaVisualizationProps = {
  lesson: CourseLesson;
  step: LessonStep;
  stepIndex: number;
  playing: boolean;
};

export default function DsaVisualization({ lesson, step, stepIndex, playing }: DsaVisualizationProps) {
  const markers = lessonMarkers(step);
  const activeIndices = new Set([
    ...step.active,
    ...markers.flatMap((marker) => marker.index === null ? [] : [marker.index]),
  ]);
  const active = step.active.filter((index) => index >= 0 && index < lesson.input.length).sort((a, b) => a - b);
  const range = (lesson.stage === "range" || lesson.stage === "window") && active.length > 1
    ? { start: active[0]!, end: active[active.length - 1]! }
    : null;
  const unpositionedMarkers = markers.filter((marker) => marker.index === null);

  return (
    <section className="dsa-visualization" aria-label={`${lesson.title} visualization`}>
      <header className="dsa-visualization-head">
        <div>
          <span><ScanEye size={14} /> LIVE VISUALIZATION</span>
          <strong>{step.title}</strong>
        </div>
        <div className={`dsa-visualization-status${playing ? " playing" : ""}`}>
          <i />
          {playing ? "PLAYING" : `STEP ${String(stepIndex + 1).padStart(2, "0")} / ${String(lesson.steps.length).padStart(2, "0")}`}
        </div>
      </header>

      <div className="dsa-visualization-board">
        <div className="dsa-visualization-board-top">
          <span>{lesson.stage === "stack" ? <Layers3 size={13} /> : <Braces size={13} />}
            {lesson.stage === "stack" ? "STACK" : "INPUT ARRAY"}
          </span>
          <small>{lesson.input.length} {lesson.input.length === 1 ? "value" : "values"}</small>
        </div>

        {unpositionedMarkers.length > 0 && (
          <div className="dsa-visualization-global-pointers" aria-label="Algorithm pointers">
            {unpositionedMarkers.map((marker, index) => (
              <span key={`${marker.name}-${index}`}><ArrowDown size={12} />{marker.name}</span>
            ))}
          </div>
        )}

        <div className={`dsa-visualization-values${lesson.stage === "stack" ? " stack" : ""}`} role="list" aria-label="Input values">
          {lesson.input.map((value, index) => {
            const cellMarkers = markers.filter((marker) => marker.index === index);
            const isActive = activeIndices.has(index);
            return (
              <div
                className={`dsa-visualization-cell${isActive ? " active" : ""}${range && index >= range.start && index <= range.end ? " in-range" : ""}${active[active.length - 1] === index ? " focused" : ""}`}
                key={`${value}-${index}`}
                role="listitem"
                aria-label={`Index ${index}, value ${value}${isActive ? ", active" : ""}`}
              >
                {cellMarkers.length > 0 && (
                  <span className="dsa-visualization-cell-pointers">
                    {cellMarkers.map((marker, markerIndex) => (
                      <span key={`${marker.name}-${markerIndex}`}><ArrowDown size={11} />{marker.name}</span>
                    ))}
                  </span>
                )}
                <span className="dsa-visualization-index">index {String(index).padStart(2, "0")}</span>
                <strong>{value}</strong>
                {isActive && <span className="dsa-visualization-cell-state">CHECKING</span>}
              </div>
            );
          })}
        </div>

        <div className="dsa-visualization-narration" aria-live="polite">
          <span className="dsa-visualization-narration-icon"><ArrowRight size={14} /></span>
          <p>{step.narration}</p>
        </div>
      </div>

      <div className="dsa-visualization-memory">
        <div className="dsa-visualization-memory-head">
          <span>STATE AT THIS STEP</span>
          <small>{step.memory.length} {step.memory.length === 1 ? "update" : "updates"}</small>
        </div>
        {step.memory.length > 0 ? (
          <div className="dsa-visualization-memory-list">
            {step.memory.map((item, index) => (
              <div key={`${step.title}-${item}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <code>{item}</code>
              </div>
            ))}
          </div>
        ) : (
          <p className="dsa-visualization-memory-empty">No stored state has changed in this step.</p>
        )}
      </div>
    </section>
  );
}
