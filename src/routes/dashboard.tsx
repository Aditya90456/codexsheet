import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bookmark, CheckCircle2, Layers, Target } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PATTERNS, PROBLEMS, TOPICS, problemBySlug, type Difficulty } from "@/data/dsa";
import { useAuth } from "@/lib/auth";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your dashboard — Codexsheet" },
      { name: "description", content: "Track solved problems, difficulty split, bookmarks and topic progress." },
      { property: "og:title", content: "Your dashboard — Codexsheet" },
      { property: "og:description", content: "See your DSA progress at a glance." },
    ],
  }),
  component: DashboardPage,
});

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

function DashboardPage() {
  const { user, loading } = useAuth();
  const { solved, bookmarked } = useProgress();

  const stats = useMemo(() => {
    const solvedProblems = solved.map(problemBySlug).filter(Boolean) as typeof PROBLEMS;
    return {
      solvedProblems,
      byDifficulty: DIFFICULTIES.map((d) => ({
        difficulty: d,
        done: solvedProblems.filter((p) => p.difficulty === d).length,
        total: PROBLEMS.filter((p) => p.difficulty === d).length,
      })),
      topics: TOPICS.map((t) => {
        const all = PROBLEMS.filter((p) => p.topic === t.slug);
        return {
          topic: t,
          total: all.length,
          done: all.filter((p) => solved.includes(p.slug)).length,
        };
      }).filter((t) => t.total > 0),
    };
  }, [solved]);

  const pct = PROBLEMS.length
    ? Math.round((stats.solvedProblems.length / PROBLEMS.length) * 100)
    : 0;

  if (!loading && !user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="text-2xl font-semibold">Log in to see your dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your streaks, bookmarks and revision list live here once you have an account.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/sheet">Browse the sheet</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          {user?.email ? `Signed in as ${user.email}.` : "Your progress overview."}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<CheckCircle2 className="h-4 w-4 text-primary" />} label="Solved" value={`${stats.solvedProblems.length}/${PROBLEMS.length}`} />
          <StatCard icon={<Target className="h-4 w-4 text-accent" />} label="Completion" value={`${pct}%`} />
          <StatCard icon={<Layers className="h-4 w-4 text-medium" />} label="Patterns available" value={String(PATTERNS.length)} />
          <StatCard icon={<Bookmark className="h-4 w-4 text-premium" />} label="Bookmarked" value={String(bookmarked.length)} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="surface-panel p-6">
            <h2 className="text-lg font-semibold">By difficulty</h2>
            <div className="mt-4 flex flex-col gap-4">
              {stats.byDifficulty.map((d) => (
                <div key={d.difficulty}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{d.difficulty}</span>
                    <span className="text-muted-foreground">
                      {d.done}/{d.total}
                    </span>
                  </div>
                  <Progress value={d.total ? (d.done / d.total) * 100 : 0} className="mt-2" />
                </div>
              ))}
            </div>
          </section>

          <section className="surface-panel p-6">
            <h2 className="text-lg font-semibold">Topic progress</h2>
            <ul className="mt-4 flex max-h-80 flex-col gap-3 overflow-auto pr-2">
              {stats.topics.map((t) => (
                <li key={t.topic.slug} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{t.topic.name}</span>
                  <Badge variant="outline">
                    {t.done}/{t.total}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="surface-panel mt-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Bookmarked problems</h2>
            <Button asChild size="sm" variant="outline">
              <Link to="/sheet">Open sheet</Link>
            </Button>
          </div>
          {bookmarked.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nothing bookmarked yet — star problems on the sheet to revisit them here.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {bookmarked.map((slug) => {
                const p = problemBySlug(slug);
                if (!p) return null;
                return (
                  <li key={slug} className="flex items-center justify-between gap-3">
                    <span className="truncate">{p.title}</span>
                    <Badge variant="outline">{p.difficulty}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="surface-panel p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}
