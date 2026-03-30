const SERVICE_TIMEOUT_MS = 12000;
const TMDB_API_BASE = "https://api.themoviedb.org/3";

class RequestServiceError extends Error {
  constructor(message, { service = "", status = 500, code = "service_error", details = null, troubleshooting = [] } = {}) {
    super(message);
    this.name = "RequestServiceError";
    this.service = service;
    this.status = status;
    this.code = code;
    this.details = details;
    this.troubleshooting = troubleshooting;
  }
}

const SERVICE_TROUBLESHOOTING = {
  radarr: [
    "Confirm Radarr is running and reachable from the W.D.I.S. host.",
    "Verify RADARR_HOST, RADARR_API_KEY, RADARR_ROOT_FOLDER, and RADARR_QUALITY_PROFILE_ID.",
    "Use Radarr's container-visible root folder path (for example /movies), not a host-only path.",
    "Open Radarr and confirm the API key has write permissions.",
    "Check firewall or reverse-proxy rules for the Radarr port."
  ],
  sonarr: [
    "Confirm Sonarr is running and reachable from the W.D.I.S. host.",
    "Verify SONARR_HOST, SONARR_API_KEY, SONARR_ROOT_FOLDER, and SONARR_QUALITY_PROFILE_ID.",
    "Use Sonarr's container-visible root folder path (for example /tv), not a host-only path.",
    "Open Sonarr and confirm the API key has write permissions.",
    "Check firewall or reverse-proxy rules for the Sonarr port."
  ]
};

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function toInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeHost(host) {
  const trimmed = String(host || "").trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, "");
  }

  return `http://${trimmed}`.replace(/\/+$/, "");
}

function parseJsonSafe(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function cleanObject(obj) {
  const output = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      output[key] = value;
    }
  });
  return output;
}

function getTroubleshootingSteps(service) {
  return [...(SERVICE_TROUBLESHOOTING[service] || [])];
}

function getRequestConfig() {
  const radarrHost = normalizeHost(process.env.RADARR_HOST);
  const sonarrHost = normalizeHost(process.env.SONARR_HOST);

  return {
    tmdbToken: String(process.env.TMDB_READ_ACCESS_TOKEN || "").trim(),
    radarr: {
      service: "radarr",
      host: radarrHost,
      apiKey: String(process.env.RADARR_API_KEY || "").trim(),
      rootFolder: String(process.env.RADARR_ROOT_FOLDER || "").trim(),
      qualityProfileId: toInteger(process.env.RADARR_QUALITY_PROFILE_ID, 1),
      monitor: toBoolean(process.env.RADARR_MONITOR, true),
      searchNow: toBoolean(process.env.RADARR_SEARCH_NOW, true),
      minimumAvailability: String(process.env.RADARR_MINIMUM_AVAILABILITY || "released").trim() || "released",
      deleteFilesOnRemove: toBoolean(process.env.RADARR_DELETE_FILES, true),
      addImportExclusionOnRemove: toBoolean(process.env.RADARR_ADD_IMPORT_EXCLUSION, false),
    },
    sonarr: {
      service: "sonarr",
      host: sonarrHost,
      apiKey: String(process.env.SONARR_API_KEY || "").trim(),
      rootFolder: String(process.env.SONARR_ROOT_FOLDER || "").trim(),
      qualityProfileId: toInteger(process.env.SONARR_QUALITY_PROFILE_ID, 1),
      monitor: toBoolean(process.env.SONARR_MONITOR, true),
      searchNow: toBoolean(process.env.SONARR_SEARCH_NOW, true),
      monitorType: String(process.env.SONARR_MONITOR_TYPE || "all").trim() || "all",
      deleteFilesOnRemove: toBoolean(process.env.SONARR_DELETE_FILES, true),
      addImportListExclusionOnRemove: toBoolean(process.env.SONARR_ADD_IMPORT_LIST_EXCLUSION, false),
    }
  };
}

function normalizeRuntimeConfigInput(input = {}, fallback = getRequestConfig()) {
  const source = input && typeof input === "object" ? input : {};
  const radarrInput = source.radarr && typeof source.radarr === "object" ? source.radarr : {};
  const sonarrInput = source.sonarr && typeof source.sonarr === "object" ? source.sonarr : {};
  const base = fallback && typeof fallback === "object" ? fallback : getRequestConfig();

  return {
    tmdbToken: String(source.tmdbToken ?? base.tmdbToken ?? "").trim(),
    radarr: {
      service: "radarr",
      host: normalizeHost(radarrInput.host ?? base.radarr?.host ?? ""),
      apiKey: String(radarrInput.apiKey ?? base.radarr?.apiKey ?? "").trim(),
      rootFolder: String(radarrInput.rootFolder ?? base.radarr?.rootFolder ?? "").trim(),
      qualityProfileId: toInteger(radarrInput.qualityProfileId, toInteger(base.radarr?.qualityProfileId, 1)),
      monitor: toBoolean(radarrInput.monitor, toBoolean(base.radarr?.monitor, true)),
      searchNow: toBoolean(radarrInput.searchNow, toBoolean(base.radarr?.searchNow, true)),
      minimumAvailability: String(radarrInput.minimumAvailability ?? base.radarr?.minimumAvailability ?? "released").trim() || "released",
      deleteFilesOnRemove: toBoolean(radarrInput.deleteFilesOnRemove, toBoolean(base.radarr?.deleteFilesOnRemove, true)),
      addImportExclusionOnRemove: toBoolean(
        radarrInput.addImportExclusionOnRemove,
        toBoolean(base.radarr?.addImportExclusionOnRemove, false)
      ),
    },
    sonarr: {
      service: "sonarr",
      host: normalizeHost(sonarrInput.host ?? base.sonarr?.host ?? ""),
      apiKey: String(sonarrInput.apiKey ?? base.sonarr?.apiKey ?? "").trim(),
      rootFolder: String(sonarrInput.rootFolder ?? base.sonarr?.rootFolder ?? "").trim(),
      qualityProfileId: toInteger(sonarrInput.qualityProfileId, toInteger(base.sonarr?.qualityProfileId, 1)),
      monitor: toBoolean(sonarrInput.monitor, toBoolean(base.sonarr?.monitor, true)),
      searchNow: toBoolean(sonarrInput.searchNow, toBoolean(base.sonarr?.searchNow, true)),
      monitorType: String(sonarrInput.monitorType ?? base.sonarr?.monitorType ?? "all").trim() || "all",
      deleteFilesOnRemove: toBoolean(sonarrInput.deleteFilesOnRemove, toBoolean(base.sonarr?.deleteFilesOnRemove, true)),
      addImportListExclusionOnRemove: toBoolean(
        sonarrInput.addImportListExclusionOnRemove,
        toBoolean(base.sonarr?.addImportListExclusionOnRemove, false)
      ),
    }
  };
}

function isServiceConfigured(config) {
  return Boolean(config?.host && config?.apiKey && config?.rootFolder && Number(config?.qualityProfileId) > 0);
}

function getConfigurationWarnings(config = getRequestConfig()) {
  const warnings = [];

  if (!config.tmdbToken) {
    warnings.push("TMDB_READ_ACCESS_TOKEN is missing. TV requests cannot map TMDB IDs to TVDB IDs.");
  }

  if (!config.radarr.host) {
    warnings.push("RADARR_HOST is missing.");
  }
  if (!config.radarr.apiKey) {
    warnings.push("RADARR_API_KEY is missing.");
  }
  if (!config.radarr.rootFolder) {
    warnings.push("RADARR_ROOT_FOLDER is missing.");
  }
  if (!Number(config.radarr.qualityProfileId)) {
    warnings.push("RADARR_QUALITY_PROFILE_ID is missing or invalid.");
  }

  if (!config.sonarr.host) {
    warnings.push("SONARR_HOST is missing.");
  }
  if (!config.sonarr.apiKey) {
    warnings.push("SONARR_API_KEY is missing.");
  }
  if (!config.sonarr.rootFolder) {
    warnings.push("SONARR_ROOT_FOLDER is missing.");
  }
  if (!Number(config.sonarr.qualityProfileId)) {
    warnings.push("SONARR_QUALITY_PROFILE_ID is missing or invalid.");
  }

  return warnings;
}

function buildServiceUrl(config, endpointPath, query = {}) {
  const normalizedPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
  const url = new URL(normalizedPath, `${config.host}/`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

function buildServiceError(serviceName, status, body, fallbackMessage) {
  const detailMessage = body?.message || body?.error || body?.errorMessage || body?.status_message || "";

  if (status === 401 || status === 403) {
    return new RequestServiceError(
      `${serviceName} rejected the API key.`,
      {
        service: serviceName.toLowerCase(),
        status,
        code: "invalid_api_key",
        details: detailMessage || null,
        troubleshooting: getTroubleshootingSteps(serviceName.toLowerCase())
      }
    );
  }

  if (status === 404) {
    return new RequestServiceError(
      detailMessage || fallbackMessage || `${serviceName} could not find the requested item.`,
      {
        service: serviceName.toLowerCase(),
        status,
        code: "not_found",
        details: detailMessage || null,
        troubleshooting: getTroubleshootingSteps(serviceName.toLowerCase())
      }
    );
  }

  if (status === 429) {
    return new RequestServiceError(
      `${serviceName} is rate-limiting requests right now.`,
      {
        service: serviceName.toLowerCase(),
        status,
        code: "rate_limited",
        details: detailMessage || null,
        troubleshooting: getTroubleshootingSteps(serviceName.toLowerCase())
      }
    );
  }

  return new RequestServiceError(
    detailMessage || fallbackMessage || `${serviceName} request failed with status ${status}.`,
    {
      service: serviceName.toLowerCase(),
      status,
      code: "service_error",
      details: detailMessage || null,
      troubleshooting: getTroubleshootingSteps(serviceName.toLowerCase())
    }
  );
}

async function serviceFetch(config, endpointPath, { method = "GET", query = {}, body = null, timeoutMs = SERVICE_TIMEOUT_MS } = {}) {
  if (!isServiceConfigured(config)) {
    throw new RequestServiceError(
      `${config.service} is not configured.`,
      {
        service: config.service,
        status: 503,
        code: "not_configured",
        troubleshooting: getTroubleshootingSteps(config.service)
      }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildServiceUrl(config, endpointPath, query), {
      method,
      headers: {
        Accept: "application/json",
        "X-Api-Key": config.apiKey,
        ...(body ? { "Content-Type": "application/json" } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    const text = await response.text();
    const data = parseJsonSafe(text);

    if (!response.ok) {
      throw buildServiceError(config.service, response.status, data, `${config.service} request failed.`);
    }

    return data;
  } catch (error) {
    if (error instanceof RequestServiceError) {
      throw error;
    }

    if (error.name === "AbortError") {
      throw new RequestServiceError(
        `${config.service} request timed out.`,
        {
          service: config.service,
          status: 504,
          code: "timeout",
          troubleshooting: getTroubleshootingSteps(config.service)
        }
      );
    }

    throw new RequestServiceError(
      `Unable to reach ${config.service}.`,
      {
        service: config.service,
        status: 503,
        code: "unreachable",
        details: error.message,
        troubleshooting: getTroubleshootingSteps(config.service)
      }
    );
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeLookupArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === "object") {
    return [value];
  }
  return [];
}

function isNotFoundError(error) {
  return error instanceof RequestServiceError && error.status === 404;
}

function posterFromImages(images) {
  if (!Array.isArray(images)) {
    return "";
  }

  const poster = images.find((entry) => entry?.coverType === "poster") || images[0];
  return String(poster?.remoteUrl || poster?.url || "").trim();
}

function normalizeFolderPath(value) {
  return String(value || "")
    .trim()
    .replace(/[\\/]+$/, "")
    .toLowerCase();
}

async function listRootFolders(config) {
  const folders = await serviceFetch(config, "/api/v3/rootfolder");
  return Array.isArray(folders) ? folders.filter((entry) => entry?.path) : [];
}

function buildRootFolderMismatchError(config, requestedPath, availableFolders) {
  const availablePaths = availableFolders.map((entry) => String(entry.path || "").trim()).filter(Boolean);
  const list = availablePaths.length ? availablePaths.join(", ") : "none returned";
  const serviceName = config.service === "sonarr" ? "Sonarr" : "Radarr";

  return new RequestServiceError(
    `${serviceName} could not use root folder "${requestedPath}". Available root folders: ${list}.`,
    {
      service: config.service,
      status: 400,
      code: "invalid_root_folder",
      troubleshooting: [
        ...getTroubleshootingSteps(config.service),
        `Set ${config.service.toUpperCase()}_ROOT_FOLDER to a valid ${serviceName} root folder path (container path).`,
      ],
    }
  );
}

async function resolveRootFolderPath(config, requestedPath) {
  const requested = String(requestedPath || "").trim();
  const folders = await listRootFolders(config);

  if (!folders.length) {
    return requested;
  }

  if (!requested) {
    return String(folders[0].path || "").trim();
  }

  const requestedNormalized = normalizeFolderPath(requested);
  const matched = folders.find((entry) => normalizeFolderPath(entry.path) === requestedNormalized);
  if (matched?.path) {
    return String(matched.path).trim();
  }

  if (folders.length === 1) {
    return String(folders[0].path || "").trim();
  }

  throw buildRootFolderMismatchError(config, requested, folders);
}

function summarizeEntry(entry, isExisting) {
  if (!entry) {
    return null;
  }

  return {
    id: entry.id || null,
    title: entry.title || "Unknown title",
    year: entry.year || null,
    images: Array.isArray(entry.images) ? entry.images : [],
    isExisting: Boolean(isExisting)
  };
}

async function findExistingRadarrMovie(tmdbId, config) {
  const existing = await serviceFetch(config, "/api/v3/movie", {
    query: { tmdbId: String(tmdbId) }
  });
  const entries = normalizeLookupArray(existing);
  return entries.find((entry) => Number(entry.tmdbId) === Number(tmdbId)) || entries[0] || null;
}

async function lookupRadarrMovie(tmdbId, config) {
  const lookup = await serviceFetch(config, "/api/v3/movie/lookup", {
    query: { term: `tmdb:${tmdbId}` }
  });
  const entries = normalizeLookupArray(lookup);
  return entries.find((entry) => Number(entry.tmdbId) === Number(tmdbId)) || entries[0] || null;
}

async function findExistingSonarrSeries(tvdbId, config) {
  const existing = await serviceFetch(config, "/api/v3/series", {
    query: { tvdbId: String(tvdbId) }
  });
  const entries = normalizeLookupArray(existing);
  return entries.find((entry) => Number(entry.tvdbId) === Number(tvdbId)) || entries[0] || null;
}

async function lookupSonarrSeries(tvdbId, config) {
  const lookup = await serviceFetch(config, "/api/v3/series/lookup", {
    query: { term: `tvdb:${tvdbId}` }
  });
  const entries = normalizeLookupArray(lookup);
  return entries.find((entry) => Number(entry.tvdbId) === Number(tvdbId)) || entries[0] || null;
}

async function searchRadarr(tmdbId, config = getRequestConfig().radarr) {
  const existing = await findExistingRadarrMovie(tmdbId, config);
  if (existing) {
    return summarizeEntry(existing, true);
  }

  const lookup = await lookupRadarrMovie(tmdbId, config);
  return summarizeEntry(lookup, Boolean(lookup?.id));
}

async function listRadarrMovies(config = getRequestConfig().radarr) {
  const rows = await serviceFetch(config, "/api/v3/movie");
  return normalizeLookupArray(rows)
    .map((entry) => ({
      id: entry.id || null,
      tmdbId: entry.tmdbId || null,
      title: entry.title || "Unknown title",
      year: entry.year || null,
      monitored: Boolean(entry.monitored),
      status: entry.status || "",
      qualityProfileId: entry.qualityProfileId || null,
      path: entry.path || "",
      hasFile: Boolean(entry.hasFile),
      sizeOnDisk: Number(entry.sizeOnDisk || 0),
      poster: posterFromImages(entry.images),
      genres: Array.isArray(entry.genres) ? entry.genres : [],
      overview: entry.overview || "",
      added: entry.added || "",
    }))
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
}

async function addToRadarr(movie, config = getRequestConfig().radarr) {
  const tmdbId = toInteger(movie?.tmdbId);
  if (!tmdbId) {
    throw new RequestServiceError("A valid TMDB ID is required for movie requests.", {
      service: "radarr",
      status: 400,
      code: "validation_error"
    });
  }

  const existing = await findExistingRadarrMovie(tmdbId, config);
  if (existing) {
    return {
      success: false,
      alreadyRequested: true,
      movieId: existing.id || null,
      message: "Already in your library."
    };
  }

  const lookup = await lookupRadarrMovie(tmdbId, config);
  if (!lookup) {
    throw new RequestServiceError("Radarr could not find this movie by TMDB ID.", {
      service: "radarr",
      status: 404,
      code: "not_found",
      troubleshooting: getTroubleshootingSteps("radarr")
    });
  }

  const rootFolderPath = await resolveRootFolderPath(
    config,
    String(movie.rootFolder || config.rootFolder || "").trim()
  );

  const payload = cleanObject({
    title: lookup.title || movie.title || "Unknown title",
    year: toInteger(lookup.year || movie.year, 0) || undefined,
    tmdbId,
    qualityProfileId: toInteger(movie.qualityProfileId, config.qualityProfileId),
    rootFolderPath,
    monitored: typeof movie.monitor === "boolean" ? movie.monitor : config.monitor,
    minimumAvailability: movie.minimumAvailability || config.minimumAvailability || "released",
    images: Array.isArray(lookup.images) ? lookup.images : [],
    addOptions: {
      searchForMovie: false,
      searchForCutoffUnmetMovie: false
    }
  });

  const created = await serviceFetch(config, "/api/v3/movie", {
    method: "POST",
    body: payload
  });

  const movieId = created?.id || null;
  const shouldSearch = movie.searchNow !== undefined ? Boolean(movie.searchNow) : config.searchNow;

  if (shouldSearch && movieId) {
    try {
      await serviceFetch(config, "/api/v3/command", {
        method: "POST",
        body: {
          name: "MoviesSearch",
          movieIds: [movieId]
        }
      });
    } catch {
      // Non-fatal: item was added, but immediate search command failed.
    }
  }

  return {
    success: true,
    movieId,
    message: "Added to Radarr queue."
  };
}

async function removeFromRadarr(movie, config = getRequestConfig().radarr) {
  const movieId = toInteger(movie?.movieId);
  const tmdbId = toInteger(movie?.tmdbId);
  if (!movieId && !tmdbId) {
    throw new RequestServiceError("A valid TMDB ID or Radarr movie ID is required for movie removal.", {
      service: "radarr",
      status: 400,
      code: "validation_error"
    });
  }

  let existing = null;
  if (movieId) {
    try {
      existing = await serviceFetch(config, `/api/v3/movie/${movieId}`);
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
    }
  }

  if (!existing && tmdbId) {
    existing = await findExistingRadarrMovie(tmdbId, config);
  }

  if (!existing?.id) {
    return {
      success: false,
      alreadyRemoved: true,
      message: "Movie is not in your library."
    };
  }

  const deleteFiles = movie.deleteFiles !== undefined
    ? Boolean(movie.deleteFiles)
    : Boolean(config.deleteFilesOnRemove);
  const addImportExclusion = movie.addImportExclusion !== undefined
    ? Boolean(movie.addImportExclusion)
    : Boolean(config.addImportExclusionOnRemove);

  await serviceFetch(config, `/api/v3/movie/${existing.id}`, {
    method: "DELETE",
    query: {
      deleteFiles,
      addImportExclusion
    }
  });

  return {
    success: true,
    movieId: existing.id,
    message: deleteFiles ? "Removed movie and deleted files from Radarr." : "Removed movie from Radarr."
  };
}

async function searchSonarr(tvdbId, config = getRequestConfig().sonarr) {
  const existing = await findExistingSonarrSeries(tvdbId, config);
  if (existing) {
    return summarizeEntry(existing, true);
  }

  const lookup = await lookupSonarrSeries(tvdbId, config);
  return summarizeEntry(lookup, Boolean(lookup?.id));
}

async function listSonarrSeries(config = getRequestConfig().sonarr) {
  const rows = await serviceFetch(config, "/api/v3/series");
  return normalizeLookupArray(rows)
    .map((entry) => ({
      id: entry.id || null,
      tvdbId: entry.tvdbId || null,
      title: entry.title || "Unknown title",
      year: entry.year || null,
      monitored: Boolean(entry.monitored),
      status: entry.status || "",
      qualityProfileId: entry.qualityProfileId || null,
      path: entry.path || "",
      seasonFolder: Boolean(entry.seasonFolder),
      poster: posterFromImages(entry.images),
      genres: Array.isArray(entry.genres) ? entry.genres : [],
      overview: entry.overview || "",
      network: entry.network || "",
      added: entry.added || "",
      episodeFileCount: Number(entry.statistics?.episodeFileCount || 0),
      episodeCount: Number(entry.statistics?.episodeCount || 0),
      totalEpisodeCount: Number(entry.statistics?.totalEpisodeCount || 0),
      sizeOnDisk: Number(entry.statistics?.sizeOnDisk || 0),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
}

async function addToSonarr(series, config = getRequestConfig().sonarr) {
  const tvdbId = toInteger(series?.tvdbId);
  if (!tvdbId) {
    throw new RequestServiceError("A valid TVDB ID is required for TV requests.", {
      service: "sonarr",
      status: 400,
      code: "validation_error"
    });
  }

  const existing = await findExistingSonarrSeries(tvdbId, config);
  if (existing) {
    return {
      success: false,
      alreadyRequested: true,
      seriesId: existing.id || null,
      message: "Already in your library."
    };
  }

  const lookup = await lookupSonarrSeries(tvdbId, config);
  if (!lookup) {
    throw new RequestServiceError("Sonarr could not find this series by TVDB ID.", {
      service: "sonarr",
      status: 404,
      code: "not_found",
      troubleshooting: getTroubleshootingSteps("sonarr")
    });
  }

  const rootFolderPath = await resolveRootFolderPath(
    config,
    String(series.rootFolder || config.rootFolder || "").trim()
  );

  const monitored = typeof series.monitor === "boolean" ? series.monitor : config.monitor;
  const payload = cleanObject({
    title: lookup.title || series.title || "Unknown title",
    tvdbId,
    qualityProfileId: toInteger(series.qualityProfileId, config.qualityProfileId),
    languageProfileId: lookup.languageProfileId || undefined,
    rootFolderPath,
    monitored,
    monitorNewItems: series.monitorType || config.monitorType || "all",
    seasonFolder: true,
    seriesType: lookup.seriesType || "standard",
    images: Array.isArray(lookup.images) ? lookup.images : [],
    seasons: Array.isArray(lookup.seasons)
      ? lookup.seasons.map((season) => ({
          ...season,
          monitored: season.monitored !== undefined ? season.monitored : monitored
        }))
      : undefined,
    addOptions: {
      searchForMissingEpisodes: false
    }
  });

  const created = await serviceFetch(config, "/api/v3/series", {
    method: "POST",
    body: payload
  });

  const seriesId = created?.id || null;
  const shouldSearch = series.searchNow !== undefined ? Boolean(series.searchNow) : config.searchNow;

  if (shouldSearch && seriesId) {
    try {
      await serviceFetch(config, "/api/v3/command", {
        method: "POST",
        body: {
          name: "SeriesSearch",
          seriesIds: [seriesId]
        }
      });
    } catch {
      // Non-fatal: item was added, but immediate search command failed.
    }
  }

  return {
    success: true,
    seriesId,
    message: "Added to Sonarr queue."
  };
}

async function removeFromSonarr(series, config = getRequestConfig().sonarr) {
  const seriesId = toInteger(series?.seriesId);
  const tvdbId = toInteger(series?.tvdbId);
  if (!seriesId && !tvdbId) {
    throw new RequestServiceError("A valid TVDB ID or Sonarr series ID is required for TV removal.", {
      service: "sonarr",
      status: 400,
      code: "validation_error"
    });
  }

  let existing = null;
  if (seriesId) {
    try {
      existing = await serviceFetch(config, `/api/v3/series/${seriesId}`);
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
    }
  }

  if (!existing && tvdbId) {
    existing = await findExistingSonarrSeries(tvdbId, config);
  }

  if (!existing?.id) {
    return {
      success: false,
      alreadyRemoved: true,
      message: "Series is not in your library."
    };
  }

  const deleteFiles = series.deleteFiles !== undefined
    ? Boolean(series.deleteFiles)
    : Boolean(config.deleteFilesOnRemove);
  const addImportListExclusion = series.addImportListExclusion !== undefined
    ? Boolean(series.addImportListExclusion)
    : Boolean(config.addImportListExclusionOnRemove);

  await serviceFetch(config, `/api/v3/series/${existing.id}`, {
    method: "DELETE",
    query: {
      deleteFiles,
      addImportListExclusion
    }
  });

  return {
    success: true,
    seriesId: existing.id,
    message: deleteFiles ? "Removed series and deleted files from Sonarr." : "Removed series from Sonarr."
  };
}

async function checkRadarrConnectivity(config = getRequestConfig().radarr) {
  if (!isServiceConfigured(config)) {
    return {
      ok: false,
      service: "radarr",
      configured: false,
      message: "Radarr request integration is not configured.",
      troubleshooting: getTroubleshootingSteps("radarr")
    };
  }

  try {
    await serviceFetch(config, "/api/v3/system/status");
    return {
      ok: true,
      service: "radarr",
      configured: true,
      message: "Radarr is connected.",
      troubleshooting: []
    };
  } catch (error) {
    if (error instanceof RequestServiceError) {
      return {
        ok: false,
        service: "radarr",
        configured: true,
        status: error.status,
        code: error.code,
        message: error.message,
        troubleshooting: error.troubleshooting.length ? error.troubleshooting : getTroubleshootingSteps("radarr")
      };
    }
    return {
      ok: false,
      service: "radarr",
      configured: true,
      status: 503,
      code: "unreachable",
      message: "Unable to reach Radarr.",
      troubleshooting: getTroubleshootingSteps("radarr")
    };
  }
}

async function checkSonarrConnectivity(config = getRequestConfig().sonarr) {
  if (!isServiceConfigured(config)) {
    return {
      ok: false,
      service: "sonarr",
      configured: false,
      message: "Sonarr request integration is not configured.",
      troubleshooting: getTroubleshootingSteps("sonarr")
    };
  }

  try {
    await serviceFetch(config, "/api/v3/system/status");
    return {
      ok: true,
      service: "sonarr",
      configured: true,
      message: "Sonarr is connected.",
      troubleshooting: []
    };
  } catch (error) {
    if (error instanceof RequestServiceError) {
      return {
        ok: false,
        service: "sonarr",
        configured: true,
        status: error.status,
        code: error.code,
        message: error.message,
        troubleshooting: error.troubleshooting.length ? error.troubleshooting : getTroubleshootingSteps("sonarr")
      };
    }
    return {
      ok: false,
      service: "sonarr",
      configured: true,
      status: 503,
      code: "unreachable",
      message: "Unable to reach Sonarr.",
      troubleshooting: getTroubleshootingSteps("sonarr")
    };
  }
}

async function getTmdbToTvdbMapping(tmdbId, tmdbToken = getRequestConfig().tmdbToken) {
  const normalizedTmdbId = toInteger(tmdbId);
  if (!normalizedTmdbId) {
    throw new RequestServiceError("A valid TMDB ID is required for TV requests.", {
      service: "tmdb",
      status: 400,
      code: "validation_error"
    });
  }

  if (!tmdbToken) {
    throw new RequestServiceError("TMDB token is missing, so TVDB mapping is unavailable.", {
      service: "tmdb",
      status: 500,
      code: "tmdb_token_missing"
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SERVICE_TIMEOUT_MS);

  try {
    const response = await fetch(`${TMDB_API_BASE}/tv/${normalizedTmdbId}/external_ids`, {
      headers: {
        Authorization: `Bearer ${tmdbToken}`,
        Accept: "application/json"
      },
      signal: controller.signal
    });

    const text = await response.text();
    const payload = parseJsonSafe(text);

    if (!response.ok) {
      throw new RequestServiceError(
        payload?.status_message || `TMDB mapping request failed with status ${response.status}.`,
        {
          service: "tmdb",
          status: response.status,
          code: "tmdb_mapping_failed"
        }
      );
    }

    const tvdbId = toInteger(payload?.tvdb_id);
    if (!tvdbId) {
      throw new RequestServiceError("TVDB mapping was not found for this TMDB show.", {
        service: "tmdb",
        status: 404,
        code: "tvdb_mapping_missing"
      });
    }

    return tvdbId;
  } catch (error) {
    if (error instanceof RequestServiceError) {
      throw error;
    }

    if (error.name === "AbortError") {
      throw new RequestServiceError("TMDB ID mapping request timed out.", {
        service: "tmdb",
        status: 504,
        code: "timeout"
      });
    }

    throw new RequestServiceError("Unable to reach TMDB for TVDB ID mapping.", {
      service: "tmdb",
      status: 503,
      code: "tmdb_unreachable",
      details: error.message
    });
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  RequestServiceError,
  addToRadarr,
  addToSonarr,
  checkRadarrConnectivity,
  checkSonarrConnectivity,
  getConfigurationWarnings,
  getRequestConfig,
  normalizeRuntimeConfigInput,
  getTmdbToTvdbMapping,
  getTroubleshootingSteps,
  isServiceConfigured,
  listRadarrMovies,
  listSonarrSeries,
  removeFromRadarr,
  removeFromSonarr,
  searchRadarr,
  searchSonarr
};
