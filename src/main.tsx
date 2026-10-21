import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthPage, AuthProvider } from "./lib/auth";
import App from "./App";
import "./styles.css";

function Root() {
  const path = window.location.pathname;
  if (path === "/sign-in" || path.startsWith("/sign-in/")) return <AuthPage mode="sign-in" />;
  if (path === "/sign-up" || path.startsWith("/sign-up/")) return <AuthPage mode="sign-up" />;
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>,
);
