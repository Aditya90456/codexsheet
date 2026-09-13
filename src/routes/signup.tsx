import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your Codexsheet account" },
      { name: "description", content: "Sign up free to track DSA problems, patterns, bookmarks and revision." },
      { property: "og:title", content: "Create your Codexsheet account" },
      { property: "og:description", content: "Start a structured DSA journey with patterns and progress tracking." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters for your password");
      return;
    }
    setBusy(true);
    try {
      const { needsConfirm } = await signUp(email, password, fullName);
      if (needsConfirm) {
        setSent(true);
        toast.success("Check your inbox to confirm your email");
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create your account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <div>
          <h1 className="text-3xl font-semibold">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Free forever for the core sheet and pattern library.
          </p>
        </div>
        {sent ? (
          <div className="surface-panel p-6 text-sm">
            <p className="font-medium">Confirm your email</p>
            <p className="mt-2 text-muted-foreground">
              We sent a confirmation link to {email}. Open it to activate your account, then log in.
            </p>
            <Button asChild className="mt-4" variant="secondary">
              <Link to="/login">Go to log in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="surface-panel flex flex-col gap-4 p-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ada Lovelace"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </form>
        )}
      </main>
    </div>
  );
}
