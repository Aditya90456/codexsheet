import { courseLessons } from "./src/deva-course-lessons";
import { hindiStep, hindiTitle } from "./src/dsa-course-hindi";
const problems: string[] = [];
for (const lesson of courseLessons) {
  if (!hindiTitle(lesson.id)) problems.push(`${lesson.id}: no Hindi title`);
  for (let i = 0; i < lesson.steps.length; i += 1) {
    const line = hindiStep(lesson.id, i);
    if (!line) { problems.push(`${lesson.id} step ${i}: missing Hindi narration (lesson has ${lesson.steps.length} steps)`); break; }
    if (line.title.trim().length < 3 || line.narration.trim().length < 25) problems.push(`${lesson.id} step ${i}: thin Hindi text`);
    if (!/[ऀ-ॿ]/.test(line.narration)) problems.push(`${lesson.id} step ${i}: not Devanagari`);
  }
  const extra = hindiStep(lesson.id, lesson.steps.length);
  if (extra) problems.push(`${lesson.id}: ${lesson.steps.length + 1} Hindi steps but ${lesson.steps.length} lesson steps`);
}
const spoken = courseLessons.reduce((sum, lesson) => sum + lesson.steps.length, 0);
console.log(problems.length ? `${problems.length} PROBLEMS\n` + problems.join("\n") : `all green · ${courseLessons.length} lessons · ${spoken} Hindi narration lines · titles present`);
