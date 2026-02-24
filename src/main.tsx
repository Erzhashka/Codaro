import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";
import "./index.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL ?? "https://placeholder.convex.cloud";
const convexClient = new ConvexReactClient(convexUrl);
const basePath = import.meta.env.VITE_BASE_PATH ?? "/";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convexClient}>
      <BrowserRouter basename={basePath}>
        <App />
      </BrowserRouter>
    </ConvexProvider>
  </StrictMode>,
);