import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { PATTERNS, PROBLEMS, TOPICS } from "@/data/dsa";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Codexsheet — Master DSA by Patterns" },
      { name: "description", content: "Stop memorizing problems. Learn patterns, build logic, and solve DSA problems with confidence." },
      { property: "og:title", content: "Codexsheet — Master DSA by Patterns" },
      { property: "og:description", content: "Learn DSA patterns, track progress and practice problems." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const stats = [
    { value: `${PATTERNS.length}+`, label: "Patterns" },
    { value: `${PROBLEMS.length}+`, label: "DSA Problems" },
    { value: `${TOPICS.length}`, label: "Topics" },
    { value: "Live", label: "Progress Tracking" },
  ];
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="relative">
        <div aria-hidden className="grid-backdrop pointer-events-none absolute inset-0 -z-10" />
        <section className="mx-auto max-w-4xl px-4 py-24 text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
            Master DSA by <span className="text-gradient">Patterns</span> 🚀
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Stop memorizing problems. Learn patterns, build logic, and solve DSA problems with confidence.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/sheet">Start DSA Sheet <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/dashboard">View Dashboard</Link>
            </Button>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="surface-panel p-5">
                <div className="font-display text-2xl font-semibold text-primary">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
