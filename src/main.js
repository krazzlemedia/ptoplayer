import { ScreeningApp } from "./screening.js";
import "./styles.css";

function boot() {
  const app = new ScreeningApp();
  app.init().catch((error) => {
    console.error("[screening] Failed to start the screening player", error);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
