import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth as useClerkAuth,
  useClerk,
  useUser,
} from "@clerk/clerk-react";
import type { ReactNode } from "react";

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
const usesDevelopmentClerkKey = publishableKey?.startsWith("pk_test_") ?? false;
const usesProductionClerkKey = publishableKey?.startsWith("pk_live_") ?? false;
const authConfigurationError = !publishableKey
  ? "Set VITE_CLERK_PUBLISHABLE_KEY in the deployment environment and rebuild the app. Use the publishable key only; never put a Clerk secret key in a VITE_ variable."
  : import.meta.env.PROD && !usesDevelopmentClerkKey && !usesProductionClerkKey
    ? "VITE_CLERK_PUBLISHABLE_KEY must be a Clerk pk_test_ or pk_live_ publishable key. Do not use a Clerk secret key here."
    : import.meta.env.PROD && usesProductionClerkKey && (isVercelProvidedDomain || clerkUsesVercelProvidedDomain)
      ? "This Vercel-provided *.vercel.app URL cannot use Clerk production keys. To use this URL, set VITE_CLERK_PUBLISHABLE_KEY to a pk_test_ key from your Clerk development instance in Vercel and redeploy. This enables development auth only."
      : import.meta.env.PROD && usesDevelopmentClerkKey && !isVercelProvidedDomain
        ? "A Clerk pk_test_ key can only be used on localhost or a Vercel-provided *.vercel.app URL. Use the pk_live_ key with your own production domain."
    : null;

export { SignInButton, SignUpButton, UserButton, useUser };

export function AuthProvider({ children }: { children: ReactNode }) {
  if (authConfigurationError) {
    return (
      <main role="alert" style={{ maxWidth: 560, margin: "12vh auto", padding: 24, fontFamily: "sans-serif" }}>
        <h1>Clerk is not configured</h1>
        <p>{authConfigurationError}</p>
      </main>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey!}>{children}</ClerkProvider>
  );
}

export function useAuth() {
  const auth = useClerkAuth();
  const clerk = useClerk();

  return {
    ...auth,
    openSignIn: () => clerk.openSignIn(),
    openSignUp: () => clerk.openSignUp(),
  };
}
