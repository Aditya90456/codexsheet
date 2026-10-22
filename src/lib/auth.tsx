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
const authConfigurationError = !publishableKey
  ? "Set VITE_CLERK_PUBLISHABLE_KEY in the deployment environment and rebuild the app. Use the publishable key only; never put a Clerk secret key in a VITE_ variable."
  : import.meta.env.PROD && !publishableKey.startsWith("pk_live_")
    ? "This production build must use the pk_live_ publishable key from your Clerk production instance. Set it in the hosting provider's Production environment and redeploy. Do not use a Clerk secret key here."
    : import.meta.env.PROD && (isVercelProvidedDomain || clerkUsesVercelProvidedDomain)
      ? "Clerk production auth cannot use a Vercel-provided *.vercel.app domain. Add a domain you control to Vercel and Clerk, configure Clerk's DNS records, update the Production publishable key, and redeploy."
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
