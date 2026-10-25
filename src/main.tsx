import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./styles.css";

// The private assistant runs as a standalone local-only page and does not
// require the app's account provider or a hosted AI service.
if (window.location.pathname === "/assistant") {
  const { default: PersonalAssistant } = await import("./PersonalAssistant");
  createRoot(document.getElementById("root")!).render(<PersonalAssistant />);
} else {

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const hasClerkPublishableKey =
  Boolean(clerkPublishableKey) &&
  !/(your|replace|placeholder)/i.test(clerkPublishableKey ?? "");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {hasClerkPublishableKey ? (
      <ClerkProvider publishableKey={clerkPublishableKey!}>
        <App />
      </ClerkProvider>
    ) : (
      <main className="setup-required">
        <h1>Clerk setup required</h1>
        <p>Add VITE_CLERK_PUBLISHABLE_KEY to your .env file to enable sign in.</p>
      </main>
    )}
  </StrictMode>,
);
}
