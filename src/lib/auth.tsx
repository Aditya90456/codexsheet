import {
  ClerkProvider,
  SignIn,
  SignUp,
  UserButton,
  useAuth as useClerkAuth,
  useUser,
} from "@clerk/clerk-react";
import type { ReactNode } from "react";
import { ArrowRight, Code2, ShieldCheck } from "lucide-react";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();
function getClerkFrontendApiDomain(key: string | undefined): string | null {
  if (!key) return null;
  const encodedDomain = key.slice(key.indexOf("_", 3) + 1);
  try {
    return window.atob(encodedDomain).replace(/\$$/, "").toLowerCase();
  } catch {
    return null;
  }
}

const clerkFrontendApiDomain = getClerkFrontendApiDomain(publishableKey);
const isVercelProvidedDomain = typeof window !== "undefined"
  && window.location.hostname.toLowerCase().endsWith(".vercel.app");
const clerkUsesVercelProvidedDomain = clerkFrontendApiDomain?.endsWith(".vercel.app") ?? false;
const authConfigurationError = !publishableKey
  ? "Set VITE_CLERK_PUBLISHABLE_KEY in the deployment environment and rebuild the app. Use the publishable key only; never put a Clerk secret key in a VITE_ variable."
  : import.meta.env.PROD && !publishableKey.startsWith("pk_live_")
    ? "This production build must use the pk_live_ publishable key from your Clerk production instance. Set it in the hosting provider's Production environment and redeploy. Do not use a Clerk secret key here."
    : import.meta.env.PROD && (isVercelProvidedDomain || clerkUsesVercelProvidedDomain)
      ? "Clerk production auth cannot use a Vercel-provided *.vercel.app domain. Add a domain you control to Vercel and Clerk, configure Clerk's DNS records, update the Production publishable key, and redeploy."
    : null;

export { UserButton, useUser };

export function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  const Component = mode === "sign-in" ? SignIn : SignUp;
  const isSignIn = mode === "sign-in";
  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="About CodexSheet">
        <a className="auth-brand" href="/" aria-label="CodexSheet home">
          <span className="auth-brand-mark"><Code2 size={19} strokeWidth={2.2} /></span>
          <span>codex<span>sheet</span></span>
        </a>
        <div className="auth-story-copy">
          <span className="auth-eyebrow"><i /> INTERVIEW PREP, WITH A PLAN</span>
          <h1>Build the instinct.<br /><em>Then trust it.</em></h1>
          <p>Practice one pattern at a time. Keep your roadmap, solutions, and progress together as you prepare for your next interview.</p>
          <div className="auth-pattern-card" aria-label="A sample problem-solving pattern">
            <div className="auth-pattern-top"><span>THE PRACTICE LOOP</span><span>01 / 03</span></div>
            <div className="auth-pattern-flow">
              <span><i>01</i><strong>Understand</strong><small>the problem</small></span>
              <ArrowRight size={15} />
              <span><i>02</i><strong>Recognize</strong><small>the pattern</small></span>
              <ArrowRight size={15} />
              <span><i>03</i><strong>Build</strong><small>the solution</small></span>
            </div>
          </div>
        </div>
        <div className="auth-story-footer"><span>250 curated problems</span><i /> <span>19 core patterns</span></div>
      </section>

      <section className="auth-form-area" aria-label={isSignIn ? "Sign in" : "Create an account"}>
        <div className="auth-form-shell">
          <div className="auth-form-heading">
            <span className="auth-form-kicker">YOUR PRACTICE, IN ONE PLACE</span>
            <h2>{isSignIn ? "Welcome back" : "Start your practice"}</h2>
            <p>{isSignIn ? "Pick up where you left off." : "Create an account to save your progress."}</p>
          </div>
          <Component
            routing="path"
            path={`/${mode}`}
            appearance={{
              variables: {
                colorPrimary: "#6268e8",
                colorText: "#191b25",
                colorTextSecondary: "#727787",
                colorBackground: "#ffffff",
                colorInputBackground: "#ffffff",
                colorInputText: "#191b25",
                borderRadius: "12px",
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              },
              elements: {
                rootBox: { width: "100%" },
                cardBox: { width: "100%", boxShadow: "none" },
                card: { width: "100%", padding: "0", boxShadow: "none", background: "transparent" },
                headerTitle: { display: "none" },
                headerSubtitle: { display: "none" },
                socialButtonsBlockButton: { minHeight: "46px", borderRadius: "10px", borderColor: "#e5e7ed", boxShadow: "none" },
                formFieldInput: { minHeight: "46px", borderRadius: "10px", borderColor: "#e0e3eb", boxShadow: "none" },
                formButtonPrimary: { minHeight: "46px", borderRadius: "10px", boxShadow: "none", fontWeight: "700" },
                footerActionLink: { color: "#555dd2", fontWeight: "700" },
                footer: { background: "transparent" },
              },
            }}
          />
          <p className="auth-trust-note"><ShieldCheck size={15} /> Your account and practice progress stay yours.</p>
          <p className="auth-switch">
            {isSignIn ? "New to CodexSheet? " : "Already have an account? "}
            <a href={isSignIn ? "/sign-up" : "/sign-in"}>{isSignIn ? "Create an account" : "Sign in"}</a>
          </p>
        </div>
        <a className="auth-back-home" href="/"><ArrowRight size={14} /> Back to CodexSheet</a>
      </section>
    </main>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (authConfigurationError) {
    return (
      <main role="alert" style={{ maxWidth: 560, margin: "12vh auto", padding: 24, fontFamily: "sans-serif" }}>
        <h1>Authentication needs setup</h1>
        <p>{authConfigurationError}</p>
      </main>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey!}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}

export function useAuth() {
  const auth = useClerkAuth();

  return {
    ...auth,
    openSignIn: () => { window.location.assign("/sign-in"); },
    openSignUp: () => { window.location.assign("/sign-up"); },
  };
}
