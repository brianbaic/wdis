import React from "react";
import ReactDOM from "react-dom/client";
import LegacyApp from "./LegacyApp";
import "../styles.css";

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

window.scrollTo({ top: 0, left: 0, behavior: "auto" });

ReactDOM.createRoot(document.querySelector("#root")).render(
  <React.StrictMode>
    <LegacyApp />
  </React.StrictMode>
);
