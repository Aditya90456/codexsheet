import { useState, useEffect, type ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export function ErrorBoundary({
  children,
  fallbackTitle = "Something went wrong loading this view",
  onReset,
}: {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Caught error:", event.error);
      setHasError(true);
      setErrorMessage(event.message || "An unexpected error occurred");
    };
    window.addEventListener("error", handleError);
    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  if (hasError) {
    return (
      <section
        style={{
          maxWidth: "1380px",
          margin: "28px auto",
          padding: "36px 32px",
          background: "var(--c-surface, #14131b)",
          border: "1px solid var(--c-border, rgba(255,255,255,0.08))",
          borderRadius: "var(--r-xl, 14px)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
        }}
        role="alert"
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.12)",
            color: "#f87171",
            display: "grid",
            placeItems: "center",
          }}
        >
          <AlertCircle size={24} />
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--c-ink, #f3f4f6)", margin: 0 }}>
          {fallbackTitle}
        </h2>
        <p style={{ color: "var(--c-ink-2, #9ca3af)", fontSize: "14px", maxWidth: "480px", margin: 0 }}>
          {errorMessage || "An unexpected error occurred. You can reload this section or navigate to another view."}
        </p>
        <button
          type="button"
          onClick={() => {
            setHasError(false);
            setErrorMessage("");
            onReset?.();
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "8px",
            padding: "9px 20px",
            borderRadius: "var(--r-sm, 8px)",
            background: "var(--c-accent, #6366f1)",
            color: "#fff",
            border: "none",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <RotateCcw size={15} /> Try again
        </button>
      </section>
    );
  }

  return <>{children}</>;
}
