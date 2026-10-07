import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./styles.css";

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
