import { createContext, useContext, useState, useEffect, type ReactNode, type FormEvent, type MouseEvent } from "react";

export interface AuthUser {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  username: string;
  primaryEmailAddress: { emailAddress: string };
  imageUrl?: string;
}

interface AuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: AuthUser | null;
  signIn: (userInfo?: Partial<AuthUser>) => void;
  signUp: (userInfo: { fullName: string; email: string; username?: string }) => void;
  signOut: () => void;
  getToken: (options?: { skipCache?: boolean }) => Promise<string | null>;
  openAuthModal: (mode: "signin" | "signup") => void;
  closeAuthModal: () => void;
}

const STORAGE_KEY_USER = "codexsheet_auth_user";
const STORAGE_KEY_SIGNED_IN = "codexsheet_auth_signed_in";

const DEFAULT_USERS: AuthUser[] = [
  {
    id: "usr_alex_chen",
    fullName: "Alex Chen",
    firstName: "Alex",
    lastName: "Chen",
    username: "alexchen",
    primaryEmailAddress: { emailAddress: "alex.chen@codexsheet.dev" },
  },
  {
    id: "usr_sophia_p",
    fullName: "Sophia Patel",
    firstName: "Sophia",
    lastName: "Patel",
    username: "sophiap",
    primaryEmailAddress: { emailAddress: "sophia.p@codexsheet.dev" },
  },
  {
    id: "usr_guest_learner",
    fullName: "Guest Learner",
    firstName: "Guest",
    lastName: "Learner",
    username: "guest_learner",
    primaryEmailAddress: { emailAddress: "learner@codexsheet.dev" },
  },
];

const AuthContext = createContext<AuthContextType>({
  isLoaded: true,
  isSignedIn: false,
  user: null,
  signIn: () => {},
  signUp: () => {},
  signOut: () => {},
  getToken: async () => null,
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(true);
  const [modalMode, setModalMode] = useState<"signin" | "signup" | null>(null);

  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      if (savedUser) {
        return JSON.parse(savedUser) as AuthUser;
      }
    } catch {
      // storage unavailable
    }
    return null;
  });

  const [isSignedIn, setIsSignedIn] = useState<boolean>(() => {
    try {
      const signedIn = localStorage.getItem(STORAGE_KEY_SIGNED_IN);
      return signedIn === "true";
    } catch {
      return false;
    }
  });

  const signIn = (userInfo?: Partial<AuthUser>) => {
    const selectedUser: AuthUser = userInfo?.id
      ? {
          id: userInfo.id,
          fullName: userInfo.fullName || "Learner",
          firstName: userInfo.fullName?.split(" ")[0] || "Learner",
          lastName: userInfo.fullName?.split(" ").slice(1).join(" ") || "",
          username: userInfo.username || (userInfo.fullName || "learner").toLowerCase().replace(/\s+/g, ""),
          primaryEmailAddress: userInfo.primaryEmailAddress || {
            emailAddress: userInfo.fullName ? `${userInfo.fullName.toLowerCase().replace(/\s+/g, "")}@codexsheet.dev` : "learner@codexsheet.dev",
          },
        }
      : user || DEFAULT_USERS[0];

    setUser(selectedUser);
    setIsSignedIn(true);
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(selectedUser));
      localStorage.setItem(STORAGE_KEY_SIGNED_IN, "true");
    } catch {
      // storage unavailable
    }
    setModalMode(null);
  };

  const signUp = (userInfo: { fullName: string; email: string; username?: string }) => {
    const trimmedName = userInfo.fullName.trim() || "New Learner";
    const username = userInfo.username?.trim() || trimmedName.toLowerCase().replace(/[^a-z0-9]/g, "") || "learner";
    const newUser: AuthUser = {
      id: `usr_${Date.now()}`,
      fullName: trimmedName,
      firstName: trimmedName.split(" ")[0] || trimmedName,
      lastName: trimmedName.split(" ").slice(1).join(" ") || "",
      username,
      primaryEmailAddress: { emailAddress: userInfo.email.trim() || `${username}@codexsheet.dev` },
    };

    setUser(newUser);
    setIsSignedIn(true);
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
      localStorage.setItem(STORAGE_KEY_SIGNED_IN, "true");
    } catch {
      // storage unavailable
    }
    setModalMode(null);
  };

  const signOut = () => {
    setUser(null);
    setIsSignedIn(false);
    try {
      localStorage.setItem(STORAGE_KEY_SIGNED_IN, "false");
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch {
      // storage unavailable
    }
  };

  const getToken = async () => (isSignedIn ? `token_${user?.id ?? "learner"}` : null);

  const openAuthModal = (mode: "signin" | "signup") => {
    setModalMode(mode);
  };

  const closeAuthModal = () => {
    setModalMode(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoaded,
        isSignedIn,
        user,
        signIn,
        signUp,
        signOut,
        getToken,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
      {modalMode && (
        <AuthModal
          mode={modalMode}
          onClose={closeAuthModal}
          onSignIn={signIn}
          onSignUp={signUp}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return {
    isLoaded: context.isLoaded,
    isSignedIn: context.isSignedIn,
    userId: context.isSignedIn ? context.user?.id ?? null : null,
    sessionId: context.isSignedIn ? `sess_${context.user?.id ?? "guest"}` : null,
    getToken: context.getToken,
    signOut: async () => context.signOut(),
    openSignIn: () => context.openAuthModal("signin"),
    openSignUp: () => context.openAuthModal("signup"),
  };
}

export function useUser() {
  const context = useContext(AuthContext);
  return {
    isLoaded: context.isLoaded,
    isSignedIn: context.isSignedIn,
    user: context.isSignedIn ? context.user : null,
  };
}

export function SignInButton({
  children,
  onClick,
}: {
  children?: ReactNode;
  mode?: string;
  onClick?: () => void;
  [key: string]: unknown;
}) {
  const { openAuthModal } = useContext(AuthContext);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) onClick();
    openAuthModal("signin");
  };

  if (children) {
    return (
      <span onClick={handleClick} style={{ display: "inline-flex", cursor: "pointer" }}>
        {children}
      </span>
    );
  }

  return (
    <button type="button" className="secondary-button" onClick={handleClick}>
      Sign In
    </button>
  );
}

export function SignUpButton({
  children,
  onClick,
}: {
  children?: ReactNode;
  mode?: string;
  onClick?: () => void;
  [key: string]: unknown;
}) {
  const { openAuthModal } = useContext(AuthContext);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) onClick();
    openAuthModal("signup");
  };

  if (children) {
    return (
      <span onClick={handleClick} style={{ display: "inline-flex", cursor: "pointer" }}>
        {children}
      </span>
    );
  }

  return (
    <button type="button" className="primary-button" onClick={handleClick}>
      Create Account
    </button>
  );
}

function AuthModal({
  mode: initialMode,
  onClose,
  onSignIn,
  onSignUp,
}: {
  mode: "signin" | "signup";
  onClose: () => void;
  onSignIn: (user?: Partial<AuthUser>) => void;
  onSignUp: (user: { fullName: string; email: string; username?: string }) => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (mode === "signup") {
      if (!fullName.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        setError("Please enter a valid email address.");
        return;
      }
      onSignUp({ fullName, email, username });
    } else {
      if (!email.trim()) {
        setError("Please enter your email or username.");
        return;
      }
      onSignIn({
        fullName: email.split("@")[0],
        primaryEmailAddress: { emailAddress: email.includes("@") ? email : `${email}@codexsheet.dev` },
      });
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.72)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        zIndex: 99999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#111418",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: "16px",
          padding: "28px 24px",
          maxWidth: "440px",
          width: "100%",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.7)",
          color: "#f1f4f9",
          position: "relative",
          animation: "fadeIn 0.15s ease-out",
        }}
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {/* Header Tabs */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "20px" }}>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null); }}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: mode === "signup" ? "rgba(99, 102, 241, 0.15)" : "transparent",
              color: mode === "signup" ? "#818cf8" : "#9ba4b2",
              border: mode === "signup" ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(null); }}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: mode === "signin" ? "rgba(99, 102, 241, 0.15)" : "transparent",
              color: mode === "signin" ? "#818cf8" : "#9ba4b2",
              border: mode === "signin" ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Sign In
          </button>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px 0", color: "#f8fafc" }}>
            {mode === "signup" ? "Join Codexsheet" : "Welcome Back"}
          </h3>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0, lineHeight: 1.45 }}>
            {mode === "signup"
              ? "Sign up to access the Code Editor, run solutions, and track problem progress."
              : "Sign in to continue your algorithmic practice and sync solutions."}
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "8px 12px",
              marginBottom: "16px",
              borderRadius: "8px",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              fontSize: "12px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {mode === "signup" && (
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Chen"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{
                  width: "100%",
                  height: "38px",
                  padding: "0 12px",
                  borderRadius: "8px",
                  backgroundColor: "#181d24",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#fff",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
              {mode === "signup" ? "Email Address" : "Email or Username"}
            </label>
            <input
              type="text"
              placeholder={mode === "signup" ? "alex@example.com" : "Enter your email or username"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                height: "38px",
                padding: "0 12px",
                borderRadius: "8px",
                backgroundColor: "#181d24",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#fff",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>

          {mode === "signup" && (
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                Username (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. alexchen"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: "100%",
                  height: "38px",
                  padding: "0 12px",
                  borderRadius: "8px",
                  backgroundColor: "#181d24",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#fff",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              height: "40px",
              marginTop: "6px",
              borderRadius: "8px",
              backgroundColor: "#6366f1",
              border: "none",
              color: "#fff",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(99, 102, 241, 0.4)",
              transition: "background 0.15s",
            }}
          >
            {mode === "signup" ? "Create Free Account" : "Sign In to Account"}
          </button>
        </form>

        <div style={{ position: "relative", margin: "20px 0 16px 0", textAlign: "center" }}>
          <div style={{ position: "absolute", inset: "50% 0", borderTop: "1px solid rgba(255,255,255,0.08)" }} />
          <span style={{ position: "relative", backgroundColor: "#111418", padding: "0 10px", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Or quick start with a profile
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {DEFAULT_USERS.slice(0, 2).map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSignIn(sample)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                borderRadius: "8px",
                backgroundColor: "#181d24",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "#e2e8f0",
                fontSize: "12px",
                textAlign: "left",
                cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)")}
              onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)")}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {sample.fullName.charAt(0)}
              </div>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <div style={{ fontWeight: 600 }}>{sample.fullName}</div>
                <div style={{ fontSize: "10px", color: "#94a3b8" }}>Demo Account</div>
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "transparent",
            border: "none",
            color: "#64748b",
            fontSize: "18px",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: "4px",
          }}
          aria-label="Close dialog"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function UserButton() {
  const { user, signOut } = useContext(AuthContext);
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
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
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
          border: "2px solid rgba(255, 255, 255, 0.2)",
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        }}
      >
        {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
      </button>

      {open && (
        <div
          onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "250px",
            backgroundColor: "#111418",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            borderRadius: "12px",
            padding: "14px",
            boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "10px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
              {user.fullName}
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.primaryEmailAddress?.emailAddress}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
              <span
                style={{
                  display: "inline-block",
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(99, 102, 241, 0.15)",
                  color: "#818cf8",
                  fontWeight: 600,
                }}
              >
                @{user.username || "learner"}
              </span>
              <span
                style={{
                  display: "inline-block",
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#34d399",
                  fontWeight: 600,
                }}
              >
                Active
              </span>
            </div>
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
              fontSize: "13px",
              fontWeight: 500,
              color: "#f87171",
              borderRadius: "6px",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)")}
            onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
