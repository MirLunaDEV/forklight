import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ForklightApp } from "@/ui/ForklightApp";
import "@/styles.css";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Forklight root element was not found.");
}

createRoot(root).render(
  <StrictMode>
    <ForklightApp />
  </StrictMode>,
);
