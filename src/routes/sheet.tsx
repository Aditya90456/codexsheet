import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bookmark, ExternalLink, Lock, Search } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PROBLEMS, TOPICS, patternBySlug, type Difficulty } from "@/data/dsa";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sheet")({
  head: () => ({
    meta: [
      { title: "DSA Sheet — patterns, problems and progress | Codexsheet" },
      {
        name: "description",
        content:
          "A pattern-first DSA sheet: every problem mapped to a topic and pattern, with progress tracking and bookmarks.",
      },
      { property: "og:title", content: "DSA Sheet — Codexsheet" },
      {
        property: "og:description",
        content: "Work through curated DSA problems grouped by topic and pattern.",
      },
    ],
  }),
  component: SheetPage,
});

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

const difficultyClass: Record<Difficulty, string> = {
  Easy: "bg-easy/15 text-easy border-easy/30",
  Medium: "bg-medium/15 text-medium border-medium/30",
  Hard: "bg-hard/15 text-hard border-hard/30",
};

function SheetPage() {
  const { solved, bookmarked, toggleSolved, toggleBookmark } = useProgress();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "All">("All");
  const [onlyUnsolved, setOnlyUnsolved] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROBLEMS.filter((p) => {
      if (difficulty !== "All" && p.difficulty !== difficulty) return false;
      if (onlyUnsolved && solved.includes(p.slug)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.pattern.toLowerCase().includes(q) ||
        p.topic.toLowerCase().includes(q)
      );
    });
  }, [query, difficulty, onlyUnsolved, solved]);

  const grouped = useMemo(
    () =>
      TOPICS.map((topic) => ({
        topic,
        problems: filtered.filter((p) => p.topic === topic.slug),
      })).filter((g) => g.problems.length > 0),
    [filtered],
  );

  const total = PROBLEMS.length;
  const done = solved.filter((s) => PROBLEMS.some((p) => p.slug === s)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold sm:text-4xl">DSA Sheet</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every problem is tagged with the topic and the pattern that solves it. Tick problems off as
          you go — your progress is saved on this device.
        </p>

        <div className="surface-panel mt-6 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {done} of {total} solved
            </span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="mt-3" />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search problems, topics or patterns"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["All", ...DIFFICULTIES] as const).map((d) => (
              <Button
                key={d}
                size="sm"
                variant={difficulty === d ? "default" : "outline"}
                onClick={() => setDifficulty(d)}
              >
                {d}
              </Button>
            ))}
            <Button
              size="sm"
              variant={onlyUnsolved ? "default" : "outline"}
              onClick={() => setOnlyUnsolved((v) => !v)}
            >
              Unsolved only
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-8">
          {grouped.map(({ topic, problems }) => {
            const topicDone = problems.filter((p) => solved.includes(p.slug)).length;
            return (
              <section key={topic.slug}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-xl font-semibold">{topic.name}</h2>
                  <span className="text-sm text-muted-foreground">
                    {topicDone}/{problems.length} · {topic.description}
                  </span>
                </div>
                <ul className="surface-panel mt-3 divide-y divide-border">
                  {problems.map((p) => {
                    const isSolved = solved.includes(p.slug);
                    const pattern = patternBySlug(p.pattern);
                    return (
                      <li
                        key={p.slug}
                        className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap"
                      >
                        <Checkbox
                          checked={isSolved}
                          onCheckedChange={() => toggleSolved(p.slug)}
                          aria-label={`Mark ${p.title} as solved`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "truncate font-medium",
                                isSolved && "text-muted-foreground line-through",
                              )}
                            >
                              {p.title}
                            </span>
                            {p.isPremium && (
                              <Lock className="h-3.5 w-3.5 shrink-0 text-premium" aria-label="Premium" />
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {pattern?.name ?? p.pattern}
                          </p>
                        </div>
                        <Badge variant="outline" className={difficultyClass[p.difficulty]}>
                          {p.difficulty}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Bookmark ${p.title}`}
                          onClick={() => toggleBookmark(p.slug)}
                        >
                          <Bookmark
                            className={cn(
                              "h-4 w-4",
                              bookmarked.includes(p.slug) && "fill-primary text-primary",
                            )}
                          />
                        </Button>
                        <Button size="icon" variant="ghost" asChild>
                          <a
                            href={p.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${p.title}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
          {grouped.length === 0 && (
            <p className="text-muted-foreground">No problems match those filters.</p>
          )}
        </div>
      </main>
    </div>
  );
}
