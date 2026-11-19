import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "motion/react";
import App from "./App";
import { ToastProvider } from "@/components/ui/Toast";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* reducedMotion="user": everything collapses to simple fades when the OS asks for less motion */}
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
);
