const express = require("express");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DIST_DIR = path.join(ROOT, "dist");
const ENV_PATH = path.join(ROOT, ".env");
const ENV_EXAMPLE_PATH = path.join(ROOT, ".env.example");
const USER_CONFIG_PATH = path.join(ROOT, "server", "user-config.json");
const INITIAL_ENV_KEYS = new Set(Object.keys(process.env));

function loadEnvFile(filePath, { overrideExisting = false, preserveKeys = new Set() } = {}) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      return;
    }

    const key = trimmed.slice(0, separator).trim();
    if (!key || preserveKeys.has(key) || (!overrideExisting && process.env[key] !== undefined)) {
      return;
    }

    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    process.env[key] = value;
  });
}

if (!fs.existsSync(ENV_PATH) && fs.existsSync(ENV_EXAMPLE_PATH)) {
  console.warn("[startup] .env was not found. Falling back to .env.example values.");
}

loadEnvFile(ENV_EXAMPLE_PATH, { overrideExisting: false });
loadEnvFile(ENV_PATH, { overrideExisting: true, preserveKeys: INITIAL_ENV_KEYS });

const {
  RequestServiceError,
  addToRadarr,
  addToSonarr,
  checkRadarrConnectivity,
  checkSonarrConnectivity,
  getConfigurationWarnings,
  getRequestConfig,
  listRadarrMovies,
  listSonarrSeries,
  normalizeRuntimeConfigInput,
  getTmdbToTvdbMapping,
  getTroubleshootingSteps,
  removeFromRadarr,
  removeFromSonarr,
  searchRadarr,
  searchSonarr
} = require("./server/radarr-sonarr");

const app = express();
const PORT = Number(process.env.PORT || 4173);
const envRequestConfig = getRequestConfig();

function readUserConfig() {
  if (!fs.existsSync(USER_CONFIG_PATH)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(USER_CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.warn(`[settings] Failed to read saved settings: ${error.message}`);
    return {};
  }
}

function writeUserConfig(config) {
  const payload = config && typeof config === "object" ? config : {};
  fs.mkdirSync(path.dirname(USER_CONFIG_PATH), { recursive: true });
  fs.writeFileSync(USER_CONFIG_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

let userConfigOverrides = normalizeRuntimeConfigInput(readUserConfig(), envRequestConfig);

function getEffectiveRequestConfig() {
  return normalizeRuntimeConfigInput(userConfigOverrides, envRequestConfig);
}

function updateUserSettings(overrides) {
  userConfigOverrides = normalizeRuntimeConfigInput(overrides, envRequestConfig);
  writeUserConfig(userConfigOverrides);
  return userConfigOverrides;
}

const initialEffectiveConfig = getEffectiveRequestConfig();
const configWarnings = getConfigurationWarnings(initialEffectiveConfig);
configWarnings.forEach((warning) => {
  console.warn(`[request-config] ${warning}`);
});

const requestServicesState = {
  radarr: {
    configured: Boolean(initialEffectiveConfig.radarr.host && initialEffectiveConfig.radarr.apiKey),
    connected: false,
    message: "Radarr status not checked yet.",
    troubleshooting: getTroubleshootingSteps("radarr"),
    checkedAt: null
  },
  sonarr: {
    configured: Boolean(initialEffectiveConfig.sonarr.host && initialEffectiveConfig.sonarr.apiKey),
    connected: false,
    message: "Sonarr status not checked yet.",
    troubleshooting: getTroubleshootingSteps("sonarr"),
    checkedAt: null
  }
};

app.use(express.json({ limit: "128kb" }));

function parseId(rawValue) {
  const parsed = Number.parseInt(String(rawValue || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function updateServiceState(serviceName, result) {
  requestServicesState[serviceName] = {
    configured: Boolean(result?.configured),
    connected: Boolean(result?.ok),
    message: result?.message || `${serviceName} status is unavailable.`,
    troubleshooting: Array.isArray(result?.troubleshooting) && result.troubleshooting.length
      ? result.troubleshooting
      : getTroubleshootingSteps(serviceName),
    checkedAt: new Date().toISOString()
  };
}

async function refreshRequestServiceConnectivity() {
  const config = getEffectiveRequestConfig();
  const [radarr, sonarr] = await Promise.all([
    checkRadarrConnectivity(config.radarr),
    checkSonarrConnectivity(config.sonarr)
  ]);

  updateServiceState("radarr", radarr);
  updateServiceState("sonarr", sonarr);
  return { radarr, sonarr };
}

async function ensureServiceReady(serviceName) {
  const config = getEffectiveRequestConfig();
  if (serviceName === "radarr") {
    const status = await checkRadarrConnectivity(config.radarr);
    updateServiceState("radarr", status);
    return status;
  }

  const status = await checkSonarrConnectivity(config.sonarr);
  updateServiceState("sonarr", status);
  return status;
}

function serviceUnavailablePayload(serviceName, status) {
  return {
    success: false,
    service: serviceName,
    code: status?.code || (!status?.configured ? "not_configured" : "service_unavailable"),
    message: status?.message || `${serviceName} is unavailable right now.`,
    troubleshooting: status?.troubleshooting?.length
      ? status.troubleshooting
      : getTroubleshootingSteps(serviceName)
  };
}

function handleRequestError(res, error, fallbackService) {
  if (error instanceof RequestServiceError) {
    res.status(error.status || 500).json({
      success: false,
      service: error.service || fallbackService || "",
      code: error.code || "service_error",
      message: error.message,
      troubleshooting: error.troubleshooting || getTroubleshootingSteps(error.service || fallbackService || "radarr")
    });
    return;
  }

  res.status(500).json({
    success: false,
    service: fallbackService || "",
    code: "unexpected_error",
    message: "The request service failed unexpectedly.",
    detail: error.message
  });
}

app.get("/health", (_req, res) => {
  const config = getEffectiveRequestConfig();
  res.json({
    ok: true,
    distReady: fs.existsSync(path.join(DIST_DIR, "index.html")),
    requestServices: requestServicesState,
    settingsConfigured: {
      tmdb: Boolean(config.tmdbToken),
      radarr: Boolean(config.radarr.host && config.radarr.apiKey),
      sonarr: Boolean(config.sonarr.host && config.sonarr.apiKey)
    }
  });
});

app.get("/api/settings", (_req, res) => {
  const config = getEffectiveRequestConfig();
  res.json({
    success: true,
    settings: config,
    requestServices: requestServicesState
  });
});

app.put("/api/settings", async (req, res) => {
  try {
    const nextConfig = updateUserSettings(req.body || {});
    ["radarr", "sonarr"].forEach((serviceName) => {
      requestServicesState[serviceName].configured = Boolean(
        nextConfig?.[serviceName]?.host && nextConfig?.[serviceName]?.apiKey
      );
      requestServicesState[serviceName].connected = false;
      requestServicesState[serviceName].checkedAt = null;
      requestServicesState[serviceName].message = `${serviceName === "radarr" ? "Radarr" : "Sonarr"} status not checked yet.`;
      requestServicesState[serviceName].troubleshooting = getTroubleshootingSteps(serviceName);
    });

    await refreshRequestServiceConnectivity();
    res.json({
      success: true,
      settings: getEffectiveRequestConfig(),
      requestServices: requestServicesState
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "settings_save_failed",
      message: "Could not save settings.",
      detail: error.message
    });
  }
});

app.post("/api/request/movie", async (req, res) => {
  const config = getEffectiveRequestConfig();
  const tmdbId = parseId(req.body?.tmdbId);
  if (!tmdbId) {
    res.status(400).json({
      success: false,
      service: "radarr",
      code: "validation_error",
      message: "tmdbId must be a positive integer."
    });
    return;
  }

  const radarrStatus = await ensureServiceReady("radarr");
  if (!radarrStatus.ok) {
    res.status(503).json(serviceUnavailablePayload("radarr", radarrStatus));
    return;
  }

  try {
    const result = await addToRadarr({
      tmdbId,
      title: req.body?.title,
      year: req.body?.year,
      searchNow: true
    }, config.radarr);

    res.json(result);
  } catch (error) {
    handleRequestError(res, error, "radarr");
  }
});

app.post("/api/request/tv", async (req, res) => {
  const config = getEffectiveRequestConfig();
  const tmdbId = parseId(req.body?.tmdbId);
  if (!tmdbId) {
    res.status(400).json({
      success: false,
      service: "sonarr",
      code: "validation_error",
      message: "tmdbId must be a positive integer."
    });
    return;
  }

  const sonarrStatus = await ensureServiceReady("sonarr");
  if (!sonarrStatus.ok) {
    res.status(503).json(serviceUnavailablePayload("sonarr", sonarrStatus));
    return;
  }

  try {
    const tvdbId = await getTmdbToTvdbMapping(tmdbId, config.tmdbToken);
    const result = await addToSonarr({
      tvdbId,
      title: req.body?.title,
      year: req.body?.year,
      searchNow: true
    }, config.sonarr);

    res.json({
      ...result,
      tvdbId
    });
  } catch (error) {
    handleRequestError(res, error, "sonarr");
  }
});

app.post("/api/request/movie/remove", async (req, res) => {
  const config = getEffectiveRequestConfig();
  const tmdbId = parseId(req.body?.tmdbId);
  if (!tmdbId) {
    res.status(400).json({
      success: false,
      service: "radarr",
      code: "validation_error",
      message: "tmdbId must be a positive integer."
    });
    return;
  }

  const radarrStatus = await ensureServiceReady("radarr");
  if (!radarrStatus.ok) {
    res.status(503).json(serviceUnavailablePayload("radarr", radarrStatus));
    return;
  }

  try {
    const result = await removeFromRadarr({
      tmdbId,
      deleteFiles: req.body?.deleteFiles
    }, config.radarr);

    res.json(result);
  } catch (error) {
    handleRequestError(res, error, "radarr");
  }
});

app.post("/api/request/tv/remove", async (req, res) => {
  const config = getEffectiveRequestConfig();
  const tmdbId = parseId(req.body?.tmdbId);
  if (!tmdbId) {
    res.status(400).json({
      success: false,
      service: "sonarr",
      code: "validation_error",
      message: "tmdbId must be a positive integer."
    });
    return;
  }

  const sonarrStatus = await ensureServiceReady("sonarr");
  if (!sonarrStatus.ok) {
    res.status(503).json(serviceUnavailablePayload("sonarr", sonarrStatus));
    return;
  }

  try {
    const tvdbId = await getTmdbToTvdbMapping(tmdbId, config.tmdbToken);
    const result = await removeFromSonarr({
      tvdbId,
      deleteFiles: req.body?.deleteFiles
    }, config.sonarr);

    res.json({
      ...result,
      tvdbId
    });
  } catch (error) {
    if (error instanceof RequestServiceError && error.code === "tvdb_mapping_missing") {
      res.json({
        success: false,
        alreadyRemoved: true,
        service: "sonarr",
        message: "Series is not in your library."
      });
      return;
    }
    handleRequestError(res, error, "sonarr");
  }
});

app.get("/api/request/status", async (req, res) => {
  const config = getEffectiveRequestConfig();
  const tmdbId = parseId(req.query.tmdbId);
  const type = String(req.query.type || "").toLowerCase();

  if (!tmdbId) {
    res.status(400).json({
      requested: false,
      code: "validation_error",
      message: "tmdbId query param must be a positive integer."
    });
    return;
  }

  if (type !== "movie" && type !== "tv") {
    res.status(400).json({
      requested: false,
      code: "validation_error",
      message: "type must be either movie or tv."
    });
    return;
  }

  if (type === "movie") {
    const radarrStatus = await ensureServiceReady("radarr");
    if (!radarrStatus.ok) {
      res.json({
        requested: false,
        service: "radarr",
        available: false,
        queue: false,
        message: radarrStatus.message,
        troubleshooting: radarrStatus.troubleshooting || getTroubleshootingSteps("radarr")
      });
      return;
    }

    try {
      const lookup = await searchRadarr(tmdbId, config.radarr);
      res.json({
        requested: Boolean(lookup?.isExisting),
        service: "radarr",
        available: true,
        queue: Boolean(lookup?.isExisting)
      });
    } catch (error) {
      handleRequestError(res, error, "radarr");
    }
    return;
  }

  const sonarrStatus = await ensureServiceReady("sonarr");
  if (!sonarrStatus.ok) {
    res.json({
      requested: false,
      service: "sonarr",
      available: false,
      queue: false,
      message: sonarrStatus.message,
      troubleshooting: sonarrStatus.troubleshooting || getTroubleshootingSteps("sonarr")
    });
    return;
  }

  try {
    const tvdbId = await getTmdbToTvdbMapping(tmdbId, config.tmdbToken);
    const lookup = await searchSonarr(tvdbId, config.sonarr);
    res.json({
      requested: Boolean(lookup?.isExisting),
      service: "sonarr",
      available: true,
      queue: Boolean(lookup?.isExisting),
      tvdbId
    });
  } catch (error) {
    if (error instanceof RequestServiceError && error.code === "tvdb_mapping_missing") {
      res.json({
        requested: false,
        service: "sonarr",
        available: true,
        queue: false,
        message: error.message
      });
      return;
    }
    handleRequestError(res, error, "sonarr");
  }
});

app.get("/api/library", async (_req, res) => {
  const config = getEffectiveRequestConfig();
  const [radarrStatus, sonarrStatus] = await Promise.all([
    ensureServiceReady("radarr"),
    ensureServiceReady("sonarr")
  ]);

  try {
    const [movies, series] = await Promise.all([
      radarrStatus.ok ? listRadarrMovies(config.radarr) : Promise.resolve([]),
      sonarrStatus.ok ? listSonarrSeries(config.sonarr) : Promise.resolve([]),
    ]);

    res.json({
      success: true,
      movies,
      series,
      services: {
        radarr: {
          available: Boolean(radarrStatus.ok),
          message: radarrStatus.message || "",
        },
        sonarr: {
          available: Boolean(sonarrStatus.ok),
          message: sonarrStatus.message || "",
        }
      }
    });
  } catch (error) {
    handleRequestError(res, error, "radarr");
  }
});

app.post("/api/library/movie/remove", async (req, res) => {
  const config = getEffectiveRequestConfig();
  const movieId = parseId(req.body?.movieId);
  if (!movieId) {
    res.status(400).json({
      success: false,
      service: "radarr",
      code: "validation_error",
      message: "movieId must be a positive integer."
    });
    return;
  }

  const radarrStatus = await ensureServiceReady("radarr");
  if (!radarrStatus.ok) {
    res.status(503).json(serviceUnavailablePayload("radarr", radarrStatus));
    return;
  }

  try {
    const result = await removeFromRadarr({
      movieId,
      deleteFiles: req.body?.deleteFiles
    }, config.radarr);

    res.json(result);
  } catch (error) {
    handleRequestError(res, error, "radarr");
  }
});

app.post("/api/library/tv/remove", async (req, res) => {
  const config = getEffectiveRequestConfig();
  const seriesId = parseId(req.body?.seriesId);
  if (!seriesId) {
    res.status(400).json({
      success: false,
      service: "sonarr",
      code: "validation_error",
      message: "seriesId must be a positive integer."
    });
    return;
  }

  const sonarrStatus = await ensureServiceReady("sonarr");
  if (!sonarrStatus.ok) {
    res.status(503).json(serviceUnavailablePayload("sonarr", sonarrStatus));
    return;
  }

  try {
    const result = await removeFromSonarr({
      seriesId,
      deleteFiles: req.body?.deleteFiles
    }, config.sonarr);

    res.json(result);
  } catch (error) {
    handleRequestError(res, error, "sonarr");
  }
});

app.use("/api/tmdb", async (req, res) => {
  const tmdbToken = getEffectiveRequestConfig().tmdbToken;
  if (!tmdbToken) {
    res.status(500).json({
      status_message: "TMDB token is not configured yet. Add it in Settings."
    });
    return;
  }

  const upstream = new URL(`https://api.themoviedb.org/3${req.path}`);
  Object.entries(req.query || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => upstream.searchParams.append(key, String(entry)));
      return;
    }

    if (value !== undefined && value !== null && value !== "") {
      upstream.searchParams.set(key, String(value));
    }
  });

  const abortController = new AbortController();
  req.on("close", () => abortController.abort());

  try {
    const upstreamResponse = await fetch(upstream, {
      headers: {
        Authorization: `Bearer ${tmdbToken}`,
        Accept: "application/json"
      },
      signal: abortController.signal
    });

    const buffer = Buffer.from(await upstreamResponse.arrayBuffer());
    const contentType = upstreamResponse.headers.get("content-type");

    res.status(upstreamResponse.status);
    if (contentType) {
      res.set("Content-Type", contentType);
    }
    if (upstreamResponse.status === 429) {
      const retryAfter = upstreamResponse.headers.get("Retry-After");
      if (retryAfter) {
        res.set("Retry-After", retryAfter);
      }
      res.set("Cache-Control", "no-store");
    } else {
      res.set("Cache-Control", upstreamResponse.ok ? "public, max-age=60" : "no-store");
    }
    res.send(buffer);
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }
    res.status(502).json({
      status_message: "The streaming data service is unavailable right now.",
      detail: error.message
    });
  }
});

app.use(express.static(DIST_DIR, { index: "index.html", maxAge: "1h" }));

app.get("*", (_req, res) => {
  const indexFile = path.join(DIST_DIR, "index.html");

  if (!fs.existsSync(indexFile)) {
    res.status(503).send("Build output is missing. Run `npm run build` first.");
    return;
  }

  res.sendFile(indexFile);
});

const server = app.listen(PORT, () => {
  console.log(`W.D.I.S. running at http://localhost:${PORT}`);
  void refreshRequestServiceConnectivity().catch((error) => {
    console.warn(`[request-health] Initial connectivity check failed: ${error.message}`);
  });
});

server.on("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    console.error(`[startup] Port ${PORT} is already in use.`);
    console.error("[startup] Stop the existing process or set PORT to a different value before running npm run serve.");
    process.exit(1);
    return;
  }

  throw error;
});
