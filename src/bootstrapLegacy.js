let bootPromise;

function configureLegacyWindow() {
  window.WDIS_CONFIG = {
    ...(window.WDIS_CONFIG || {}),
    tmdbApiBase: import.meta.env.VITE_TMDB_API_BASE || "/api/tmdb",
    language: import.meta.env.VITE_TMDB_LANGUAGE || "en-US",
    region: import.meta.env.VITE_TMDB_REGION || "US",
  };
}

export function bootstrapLegacyApp() {
  if (window.__WDIS_LEGACY_BOOTSTRAPPED__) {
    return bootPromise || Promise.resolve();
  }

  configureLegacyWindow();
  window.__WDIS_LEGACY_BOOTSTRAPPED__ = true;
  bootPromise = import("../app.js");
  return bootPromise;
}
