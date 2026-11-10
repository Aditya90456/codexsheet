import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "./bootstrap-compat.css";
import "./styles.css";
import "./redesign.css";
import "./deva-runner.css";
import "./deva-course.css";
import "./mentorship.css";
import "./guru.css";
import "./cslabs.css";
import "./pattern-library.css";
import "./mentees.css";
import "./marketplace.css";
import "./articleReader.css";
import "./home.css";
import "./ui.css";
import "./study-plan.css";
import "./dashboard-hub.css";

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
