import {
  ClerkProvider,
  SignIn,
  SignUp,
  UserButton,
  useAuth as useClerkAuth,
  useUser,
} from "@clerk/clerk-react";
import type { ReactNode } from "react";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();

export { UserButton, useUser };

export function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  const Component = mode === "sign-in" ? SignIn : SignUp;
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f5f6f8" }}>
      <Component routing="path" path={`/${mode}`} />
    </main>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!publishableKey) {
    return (
      <main role="alert" style={{ maxWidth: 560, margin: "12vh auto", padding: 24, fontFamily: "sans-serif" }}>
        <h1>Clerk is not configured</h1>
        <p>Set VITE_CLERK_PUBLISHABLE_KEY in your .env file, then restart the development server.</p>
      </main>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
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
