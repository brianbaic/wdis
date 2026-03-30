import { useEffect } from "react";
import legacyMarkup from "./legacy-shell.html?raw";
import { bootstrapLegacyApp } from "./bootstrapLegacy";

export default function LegacyApp() {
  useEffect(() => {
    void bootstrapLegacyApp();
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: legacyMarkup }} />;
}
