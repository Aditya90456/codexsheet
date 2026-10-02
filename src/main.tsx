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
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        appearance={{
          variables: {
            colorPrimary: "#a78bfa",
            colorBackground: "#191620",
            colorText: "#f3eefb",
            colorInputBackground: "#100e15",
            colorInputText: "#f3eefb",
          },
        }}
      >
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