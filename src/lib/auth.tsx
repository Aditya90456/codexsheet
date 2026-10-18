import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  ClerkProvider as RealClerkProvider,
  useAuth as useRealAuth,
  useUser as useRealUser,
  SignInButton as RealSignInButton,
  SignUpButton as RealSignUpButton,
  UserButton as RealUserButton,
} from "@clerk/clerk-react";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
export const hasClerkPublishableKey =
  Boolean(clerkPublishableKey) &&
  !/(your|replace|placeholder)/i.test(clerkPublishableKey ?? "");

interface MockUser {
  id: string;
  fullName: string;
  username: string;
  primaryEmailAddress: { emailAddress: string };
}

interface MockAuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: MockUser | null;
  signIn: () => void;
  signOut: () => void;
  getToken: (options?: { skipCache?: boolean }) => Promise<string | null>;
}

const defaultUser: MockUser = {
  id: "guest-learner",
  fullName: "Guest Learner",
  username: "guest_learner",
  primaryEmailAddress: { emailAddress: "learner@codexsheet.dev" },
};

const MockAuthContext = createContext<MockAuthContextType>({
  isLoaded: true,
  isSignedIn: true,
  user: defaultUser,
  signIn: () => {},
  signOut: () => {},
  getToken: async () => "mock-guest-token",
});

function MockAuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem("codexsheet-auth-signed-in") !== "false";
    } catch {
      return true;
    }
  });

  const signIn = () => {
    setIsSignedIn(true);
    try {
      localStorage.setItem("codexsheet-auth-signed-in", "true");
    } catch {
      // storage unavailable
    }
  };

  const signOut = () => {
    setIsSignedIn(false);
    try {
      localStorage.setItem("codexsheet-auth-signed-in", "false");
    } catch {
      // storage unavailable
    }
  };

  const getToken = async () => (isSignedIn ? "mock-guest-token" : null);

  return (
    <MockAuthContext.Provider
      value={{
        isLoaded: true,
        isSignedIn,
        user: isSignedIn ? defaultUser : null,
        signIn,
        signOut,
        getToken,
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (hasClerkPublishableKey) {
    return (
      <RealClerkProvider publishableKey={clerkPublishableKey!}>
        {children}
      </RealClerkProvider>
    );
  }
  return <MockAuthProvider>{children}</MockAuthProvider>;
}

export function useAuth() {
  if (hasClerkPublishableKey) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useRealAuth();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const context = useContext(MockAuthContext);
  return {
    isLoaded: context.isLoaded,
    isSignedIn: context.isSignedIn,
    userId: context.isSignedIn ? context.user?.id ?? null : null,
    sessionId: context.isSignedIn ? "mock-guest-session" : null,
    getToken: context.getToken,
    signOut: async () => context.signOut(),
  };
}

export function useUser() {
  if (hasClerkPublishableKey) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useRealUser();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const context = useContext(MockAuthContext);
  return {
    isLoaded: context.isLoaded,
    isSignedIn: context.isSignedIn,
    user: context.user,
  };
}

export function SignInButton({
  children,
  ...rest
}: {
  children?: ReactNode;
  mode?: string;
  onClick?: () => void;
  [key: string]: unknown;
}) {
  if (hasClerkPublishableKey) {
    return <RealSignInButton {...(rest as any)}>{children}</RealSignInButton>;
  }

  return <MockAuthTrigger action="signin">{children}</MockAuthTrigger>;
}

export function SignUpButton({
  children,
  ...rest
}: {
  children?: ReactNode;
  mode?: string;
  onClick?: () => void;
  [key: string]: unknown;
}) {
  if (hasClerkPublishableKey) {
    return <RealSignUpButton {...(rest as any)}>{children}</RealSignUpButton>;
  }

  return <MockAuthTrigger action="signup">{children}</MockAuthTrigger>;
}

function MockAuthTrigger({
  action,
  children,
}: {
  action: "signin" | "signup";
  children?: ReactNode;
}) {
  const { signIn } = useContext(MockAuthContext);
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = (e: any) => {
    e.preventDefault();
    setModalOpen(true);
  };

  return (
    <>
      <span onClick={handleClick} style={{ display: "inline-flex", cursor: "pointer" }}>
        {children || <button className="primary-button">{action === "signin" ? "Sign In" : "Sign Up"}</button>}
      </span>
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "var(--c-surface, #13161a)",
              border: "1px solid var(--c-border-hi, rgba(255,255,255,0.18))",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
              color: "var(--c-ink, #f1f4f9)",
            }}
            onClick={(e: any) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
              {action === "signin" ? "Sign In to Codexsheet" : "Create Codexsheet Account"}
            </h3>
            <p style={{ fontSize: "13px", color: "var(--c-ink-2, #9ba4b2)", marginBottom: "20px", lineHeight: 1.5 }}>
              You are running in demo mode. You can sign in immediately as a Guest Learner to track problems and progress.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                className="primary-button"
                style={{
                  width: "100%",
                  height: "40px",
                  borderRadius: "8px",
                  background: "var(--c-accent, #6366f1)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => {
                  signIn();
                  setModalOpen(false);
                }}
              >
                Continue as Guest Learner
              </button>
              <button
                type="button"
                style={{
                  width: "100%",
                  height: "36px",
                  borderRadius: "8px",
                  background: "transparent",
                  color: "var(--c-ink-3, #636c7a)",
                  border: "1px solid var(--c-border, rgba(255,255,255,0.07))",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
            </div>
            <div
              style={{
                marginTop: "16px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.03)",
                fontSize: "11px",
                color: "var(--c-ink-3, #636c7a)",
                lineHeight: 1.4,
              }}
            >
              Tip: Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> to enable production Clerk cloud authentication.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function UserButton() {
  if (hasClerkPublishableKey) {
    return <RealUserButton />;
  }

  return <MockUserButton />;
}

function MockUserButton() {
  const { user, signOut } = useContext(MockAuthContext);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  if (!user) return null;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={(e: any) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="User profile menu"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 700,
          border: "2px solid rgba(255,255,255,0.15)",
          cursor: "pointer",
        }}
      >
        {user.fullName ? user.fullName.charAt(0).toUpperCase() : "G"}
      </button>

      {open && (
        <div
          onClick={(e: any) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "240px",
            backgroundColor: "var(--c-surface, #13161a)",
            border: "1px solid var(--c-border-hi, rgba(255,255,255,0.18))",
            borderRadius: "12px",
            padding: "12px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.5)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ borderBottom: "1px solid var(--c-border, rgba(255,255,255,0.08))", paddingBottom: "10px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--c-ink, #f1f4f9)" }}>
              {user.fullName}
            </div>
            <div style={{ fontSize: "11px", color: "var(--c-ink-3, #636c7a)", marginTop: "2px" }}>
              {user.primaryEmailAddress?.emailAddress}
            </div>
            <span
              style={{
                display: "inline-block",
                marginTop: "6px",
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "4px",
                backgroundColor: "rgba(99,102,241,0.15)",
                color: "var(--c-accent-2, #818cf8)",
                fontWeight: 600,
              }}
            >
              Demo Profile
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              signOut();
              setOpen(false);
            }}
            style={{
              padding: "8px 10px",
              textAlign: "left",
              fontSize: "12px",
              color: "var(--c-hard, #f87171)",
              borderRadius: "6px",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e: any) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(248,113,113,0.1)")}
            onMouseLeave={(e: any) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
