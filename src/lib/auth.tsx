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

export { SignInButton, SignUpButton, UserButton, useUser };

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!publishableKey) {
    return (
      <main role="alert" style={{ maxWidth: 560, margin: "12vh auto", padding: 24, fontFamily: "sans-serif" }}>
        <h1>Clerk is not configured</h1>
        <p>Set VITE_CLERK_PUBLISHABLE_KEY in your .env file, then restart the development server.</p>
      </main>
    );
  }

  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
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
