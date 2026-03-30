const CONFIG = window.WDIS_CONFIG || {};

const TMDB = {
  apiBase: CONFIG.tmdbApiBase || "https://api.themoviedb.org/3",
  language: CONFIG.language || "en-US",
  region: CONFIG.region || "US",
  imageBase: "https://image.tmdb.org/t/p",
  posterSize: "w780",
  backdropSize: "w1280",
  profileSize: "w500",
};

const state = {
  view: "home",
  query: "",
  genre: "Trending",
  activeSearchContext: {
    mode: "trending",
    query: "",
    genreName: "",
    serviceKey: "",
    serviceName: "",
    mediaType: "all",
  },
  homeServiceFilter: "All Services",
  homeServiceFilterOffset: 0,
  homeServiceLoading: false,
  homeServicePreloading: false,
  homeServiceRequestId: 0,
  homeServiceSupplementCache: new Map(),
  homeGenreSupplementCache: new Map(),
  resultsType: "All Results",
  selectedKey: null,
  homePreviewKey: null,
  homePreviewSide: "right",
  homePreviewDescriptionExpanded: false,
  homePreviewProvidersExpanded: false,
  homePreviewRequestId: 0,
  featuredItems: [],
  featuredMovieOffset: 0,
  featuredSeriesOffset: 0,
  trendingPageLoaded: 0,
  trendingHasMore: true,
  trendingLoadingMore: false,
  resultsItems: [],
  resultsMode: "trending",
  resultsGenre: "",
  resultsPageLoaded: 0,
  resultsHasMore: true,
  resultsLoadingMore: false,
  resultsAutoLoadCount: 0,
  heroSuggestions: [],
  resultsSuggestions: [],
  selectedPersonId: null,
  genres: { movie: new Map(), tv: new Map() },
  itemCache: new Map(),
  previewCache: new Map(),
  detailCache: new Map(),
  personCache: new Map(),
  requestedItems: new Map(),
  requestInProgress: new Map(),
  requestStatusChecks: new Map(),
  requestError: null,
  libraryMovies: [],
  librarySeries: [],
  libraryQuery: "",
  libraryGenre: "All genres",
  libraryType: "All",
  libraryLoading: false,
  libraryStatus: "",
  settingsLoaded: false,
  settingsSaving: false,
  radarrConnected: false,
  sonarrConnected: false,
  requestServiceStatusLoaded: false,
  requestServices: {
    radarr: {
      configured: false,
      connected: false,
      message: "Radarr status unavailable.",
      troubleshooting: [],
    },
    sonarr: {
      configured: false,
      connected: false,
      message: "Sonarr status unavailable.",
      troubleshooting: [],
    },
  },
};

const RE_NON_ALPHANUMERIC = /[^a-z0-9]+/g;

const resultTypes = ["All Results", "Movies", "Series"];
const libraryTypes = ["All", "Movies", "Series"];
const LIBRARY_ALL_GENRES = "All genres";
const HOME_GENRE_CHIPS = [
  "Trending",
  "Horror",
  "Animation",
  "Comedy",
  "Action",
  "Drama",
  "Romance",
  "Mystery",
  "Crime",
  "Action & Adventure",
];
const HOME_FEATURED_READY_WINDOWS = 3;
const HOME_TRENDING_COVERAGE_PAGE_BUDGET = 10;
const HOME_SERVICE_SUPPLEMENT_PAGE_BUDGET = 8;
const HOME_GENRE_SUPPLEMENT_PAGE_BUDGET = 8;
const HOME_BACKGROUND_PRELOAD_TRENDING_PAGES = 8;
const HOME_BACKGROUND_PRELOAD_SUPPLEMENT_PAGES = 6;
const REQUEST_STATUS_RETRY_DELAY_MS = 5 * 60 * 1000;
const HOME_GENRE_EQUIVALENTS = {
  Horror: {
    movie: ["Horror"],
    tv: ["Mystery", "Sci-Fi & Fantasy"],
  },
  Action: {
    movie: ["Action"],
    tv: ["Action & Adventure"],
  },
  "Action & Adventure": {
    movie: ["Action", "Adventure"],
    tv: ["Action & Adventure"],
  },
};

const views = document.querySelectorAll(".view");
const pageShell = document.querySelector(".page-shell");
const navLinks = document.querySelectorAll(".top-nav-link");
const resultsGrid = document.querySelector("#results-grid");
const castGrid = document.querySelector("#cast-grid");
const crewGrid = document.querySelector("#crew-grid");
const relatedGrid = document.querySelector("#related-grid");
const genreChips = document.querySelector("#genre-chips");
const resultTypeFilters = document.querySelector("#result-type-filters");
const heroSearchForm = document.querySelector("#hero-search-form");
const resultsSearchForm = document.querySelector("#results-search-form");
const heroSearchInput = document.querySelector("#hero-search-input");
const resultsSearchInput = document.querySelector("#results-search-input");
const heroSearchSuggestions = document.querySelector("#hero-search-suggestions");
const resultsSearchSuggestions = document.querySelector("#results-search-suggestions");
const genreFilterStatus = document.querySelector("#genre-filter-status");
const genreJumpLink = document.querySelector("#genre-jump-link");
const resultsTitle = document.querySelector("#results-title");
const resultsSummary = document.querySelector("#results-summary");
const resultsFeedFooter = document.querySelector("#results-feed-footer");
const resultsSection = document.querySelector("#results-section");
const homeFeaturedSection = document.querySelector("#home-featured-section");
const homeFeaturedEyebrow = document.querySelector("#home-featured-eyebrow");
const homeFeaturedTitle = document.querySelector("#home-featured-title");
const homeFeaturedSummary = document.querySelector("#home-featured-summary");
const detailHero = document.querySelector("#detail-hero");
const detailProviders = document.querySelector("#detail-providers");
const detailStats = document.querySelector("#detail-stats");
const detailTrailer = document.querySelector("#detail-trailer");
const detailInsights = document.querySelector("#detail-insights");
const personSpotlightSection = document.querySelector("#person-spotlight-section");
const personSpotlightTitle = document.querySelector("#person-spotlight-title");
const personSpotlightSummary = document.querySelector("#person-spotlight-summary");
const personSpotlightContent = document.querySelector("#person-spotlight-content");
const featuredMoviesGrid = document.querySelector("#featured-movies-grid");
const featuredSeriesGrid = document.querySelector("#featured-series-grid");
const homeServiceFilters = document.querySelector("#home-service-filters");
const serviceFiltersPrevButton = document.querySelector("#service-filters-prev");
const serviceFiltersNextButton = document.querySelector("#service-filters-next");
const featuredMoviesPrevButton = document.querySelector("#featured-movies-prev");
const featuredMoviesNextButton = document.querySelector("#featured-movies-next");
const featuredSeriesPrevButton = document.querySelector("#featured-series-prev");
const featuredSeriesNextButton = document.querySelector("#featured-series-next");
const featurePreviewPanel = document.querySelector("#feature-preview-panel");
const featurePreviewContent = document.querySelector("#feature-preview-content");
const featurePreviewClose = document.querySelector("#feature-preview-close");
const featurePreviewScrim = document.querySelector("#feature-preview-scrim");
const librarySearchForm = document.querySelector("#library-search-form");
const librarySearchInput = document.querySelector("#library-search-input");
const librarySearchSuggestions = document.querySelector("#library-search-suggestions");
const libraryRefreshButton = document.querySelector("#library-refresh-button");
const libraryGenreChips = document.querySelector("#library-genre-chips");
const libraryTypeFilters = document.querySelector("#library-type-filters");
const librarySummary = document.querySelector("#library-summary");
const libraryStatus = document.querySelector("#library-status");
const libraryMoviesGrid = document.querySelector("#library-movies-grid");
const librarySeriesGrid = document.querySelector("#library-series-grid");
const settingsForm = document.querySelector("#settings-form");
const settingsSaveButton = document.querySelector("#settings-save-button");
const settingsReloadButton = document.querySelector("#settings-reload-button");
const settingsFeedback = document.querySelector("#settings-feedback");
const settingsTmdbTokenInput = document.querySelector("#settings-tmdb-token");
const settingsRadarrHostInput = document.querySelector("#settings-radarr-host");
const settingsRadarrApiKeyInput = document.querySelector("#settings-radarr-api-key");
const settingsRadarrRootInput = document.querySelector("#settings-radarr-root");
const settingsRadarrQualityInput = document.querySelector("#settings-radarr-quality");
const settingsSonarrHostInput = document.querySelector("#settings-sonarr-host");
const settingsSonarrApiKeyInput = document.querySelector("#settings-sonarr-api-key");
const settingsSonarrRootInput = document.querySelector("#settings-sonarr-root");
const settingsSonarrQualityInput = document.querySelector("#settings-sonarr-quality");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const shelfAnimationTimers = new WeakMap();
let previewHideTimer = null;
let previewDetailWarmTimer = null;
let previewHoverPrefetchTimer = null;
let previewHoverPrefetchKey = "";
let requestSurfaceRenderFrame = 0;
let savedHomeScrollY = 0;
let previewTriggerElement = null;

const PROVIDER_URLS = {
  Netflix: "https://www.netflix.com",
  "Prime Video": "https://www.primevideo.com",
  "Amazon Prime Video": "https://www.primevideo.com",
  "Amazon Video": "https://www.primevideo.com",
  "Amazon Prime Video with Ads": "https://www.primevideo.com",
  Hulu: "https://www.hulu.com",
  "Apple TV": "https://tv.apple.com",
  "Apple TV Plus": "https://tv.apple.com",
  "Apple TV+": "https://tv.apple.com",
  "Apple TV Store": "https://tv.apple.com",
  Max: "https://play.max.com",
  "Disney Plus": "https://www.disneyplus.com",
  "Disney+": "https://www.disneyplus.com",
  Peacock: "https://www.peacocktv.com",
  Paramount: "https://www.paramountplus.com",
  "Paramount Plus": "https://www.paramountplus.com",
  "Paramount+": "https://www.paramountplus.com",
  Crunchyroll: "https://www.crunchyroll.com",
  "AMC Plus": "https://www.amcplus.com",
  "AMC+": "https://www.amcplus.com",
  Tubi: "https://tubitv.com",
  "Google Play Movies": "https://play.google.com/store/movies",
  "Google Play": "https://play.google.com/store/movies",
  Pluto: "https://pluto.tv",
  "Pluto TV": "https://pluto.tv",
  YouTube: "https://www.youtube.com/movies",
  Fandango: "https://athome.fandango.com",
  "Fandango At Home": "https://athome.fandango.com",
  MUBI: "https://mubi.com",
};
const CANONICAL_PROVIDER_URLS_BY_KEY = {
  netflix: PROVIDER_URLS.Netflix,
  disneyplus: PROVIDER_URLS["Disney+"],
  primevideo: PROVIDER_URLS["Prime Video"],
  appletv: PROVIDER_URLS["Apple TV+"],
  hulu: PROVIDER_URLS.Hulu,
  hbo: PROVIDER_URLS.Max,
  discoveryplus: "https://www.discoveryplus.com",
  abc: "https://abc.com",
  fox: "https://www.fox.com",
  cinemax: PROVIDER_URLS.Max,
  amc: PROVIDER_URLS["AMC+"],
  showtime: "https://www.paramountplus.com",
  starz: "https://www.starz.com",
  cw: "https://www.cwtv.com",
  nbc: "https://www.nbc.com",
  cbs: "https://www.cbs.com",
  paramountplus: PROVIDER_URLS["Paramount+"],
  bbcone: "https://www.bbc.co.uk/bbcone",
  cartoonnetwork: "https://www.cartoonnetwork.com",
  adultswim: "https://www.adultswim.com",
  nick: "https://www.nick.com",
  peacock: PROVIDER_URLS.Peacock,
  crunchyroll: PROVIDER_URLS.Crunchyroll,
  tubi: PROVIDER_URLS.Tubi,
  plutotv: PROVIDER_URLS["Pluto TV"],
  youtube: PROVIDER_URLS.YouTube,
  fandangoathome: PROVIDER_URLS["Fandango At Home"],
  googleplaymovies: PROVIDER_URLS["Google Play Movies"],
  googleplay: PROVIDER_URLS["Google Play"],
  mubi: PROVIDER_URLS.MUBI,
  plex: "https://www.plex.tv/watch-free",
};

const HOME_SERVICE_CATALOG = [
  { key: "all", name: "All Services", aliases: ["All Services"] },
  { key: "netflix", name: "Netflix", aliases: ["Netflix", "Netflix Standard with Ads"], providerId: 8 },
  { key: "disneyplus", name: "Disney+", aliases: ["Disney+", "Disney Plus"], providerId: 337 },
  { key: "primevideo", name: "Prime Video", aliases: ["Prime Video", "Amazon Prime Video", "Amazon Prime Video with Ads", "Amazon Prime Video Free with Ads", "Amazon Video"], providerId: 9 },
  { key: "appletv", name: "Apple TV+", aliases: ["Apple TV+", "Apple TV", "Apple TV Plus", "Apple TV Store"], providerId: 350 },
  { key: "hulu", name: "Hulu", aliases: ["Hulu", "Hulu Disney Bundle"], providerId: 15 },
  { key: "hbo", name: "HBO", aliases: ["HBO", "HBO Max", "Max", "Max Amazon Channel"], providerId: 189 },
  { key: "discoveryplus", name: "discovery+", aliases: ["discovery+", "Discovery+", "Discovery Plus"], providerId: 524 },
  { key: "abc", name: "ABC", aliases: ["ABC"] },
  { key: "fox", name: "FOX", aliases: ["FOX", "Fox"] },
  { key: "cinemax", name: "Cinemax", aliases: ["Cinemax"] },
  { key: "amc", name: "AMC", aliases: ["AMC", "AMC+", "AMC Plus", "AMC+ Amazon Channel"], providerId: 526 },
  { key: "showtime", name: "Showtime", aliases: ["Showtime", "SHOWTIME", "SHOWTIME Amazon Channel"] },
  { key: "starz", name: "STARZ", aliases: ["STARZ", "Starz"], providerId: 43 },
  { key: "cw", name: "The CW", aliases: ["The CW", "CW"] },
  { key: "nbc", name: "NBC", aliases: ["NBC"] },
  { key: "cbs", name: "CBS", aliases: ["CBS"] },
  { key: "paramountplus", name: "Paramount+", aliases: ["Paramount+", "Paramount Plus", "Paramount"], providerId: 531 },
  { key: "bbcone", name: "BBC One", aliases: ["BBC One"] },
  { key: "cartoonnetwork", name: "Cartoon Network", aliases: ["Cartoon Network", "CN"] },
  { key: "adultswim", name: "Adult Swim", aliases: ["Adult Swim"] },
  { key: "nick", name: "Nick", aliases: ["Nick", "Nickelodeon"] },
  { key: "peacock", name: "Peacock", aliases: ["Peacock", "Peacock Premium", "Peacock Premium Plus"], providerId: 386 },
];

const HOME_SERVICE_BY_KEY = new Map(HOME_SERVICE_CATALOG.map((service) => [service.key, service]));
const HOME_SERVICE_ALIAS_INDEX = new Map(
  HOME_SERVICE_CATALOG.flatMap((service) =>
    service.aliases.map((alias) => [alias.toLowerCase().replace(RE_NON_ALPHANUMERIC, ""), service.key])
  )
);
const HOME_SERVICE_POPULARITY_ORDER = [
  "netflix",
  "primevideo",
  "disneyplus",
  "hulu",
  "hbo",
  "appletv",
  "peacock",
  "paramountplus",
  "discoveryplus",
  "amc",
  "starz",
  "showtime",
  "abc",
  "fox",
  "nbc",
  "cbs",
  "cw",
  "cinemax",
  "bbcone",
  "cartoonnetwork",
  "adultswim",
  "nick",
];
const HOME_SERVICE_POPULARITY_INDEX = new Map(
  HOME_SERVICE_POPULARITY_ORDER.map((key, index) => [key, index])
);
const REQUEST_SERVICE_BY_MEDIA = {
  movie: "radarr",
  tv: "sonarr",
};
const REQUEST_SERVICE_LABELS = {
  radarr: "Radarr",
  sonarr: "Sonarr",
};
const REQUEST_DEFAULT_TROUBLESHOOTING = {
  radarr: [
    "Confirm Radarr is running and reachable from this machine.",
    "Verify RADARR_HOST and RADARR_API_KEY in your .env file.",
    "Make sure your Radarr API key has write permissions.",
  ],
  sonarr: [
    "Confirm Sonarr is running and reachable from this machine.",
    "Verify SONARR_HOST and SONARR_API_KEY in your .env file.",
    "Make sure your Sonarr API key has write permissions.",
  ],
};
const TMDB_SERVICE_LOGO_PATHS = {
  netflix: "/wwemzKWzjKYJFfCeiB57q3r4Bcm.png",
  disneyplus: "/gJ8VX6JSu3ciXHuC2dDGAo2lvwM.png",
  primevideo: "/ifhbNuuVnlwYy5oXA5VIb2YR8AZ.png",
  appletv: "/4KAy34EHvRM25Ih8wb82AuGU7zJ.png",
  hulu: "/pqUTCleNUiTLAVlelGxUgWn1ELh.png",
  hbo: "/tuomPhY2UtuPTqqFnKMVHvSb724.png",
  discoveryplus: "/1D1bS3Dyw4ScYnFWTlBOvJXC3nb.png",
  abc: "/ndAvF4JLsliGreX87jAc9GdjmJY.png",
  cinemax: "/6mSHSquNpfLgDdv6VnOOvC5Uz2h.png",
  amc: "/pmvRmATOCaDykE6JrVoeYxlFHw3.png",
  showtime: "/Allse9kbjiP6ExaQrnSpIhkurEi.png",
  starz: "/8GJjw3HHsAJYwIWKIPBPfqMxlEa.png",
  cw: "/ge9hzeaU7nMtQ4PjkFlc68dGAJ9.png",
  nbc: "/o3OedEP0f9mfZr33jz2BfXOUK5.png",
  cbs: "/nm8d7P7MJNiBLdgIzUK0gkuEA4r.png",
  paramountplus: "/fi83B1oztoS47xxcemFdPMhIzK.png",
  bbcone: "/mVn7xESaTNmjBUyUtGNvDQd3CT1.png",
  cartoonnetwork: "/c5OC6oVCg6QP4eqzW6XIq17CQjI.png",
  adultswim: "/9AKyspxVzywuaMuZ1Bvilu8sXly.png",
  nick: "/ikZXxg6GnwpzqiZbRPhJGaZapqB.png",
  peacock: "/gIAcGTjKKr0KOHL5s4O36roJ8p7.png",
  fox: "/1DSpHrWyOORkL9N2QHX7Adt31mQ.png",
};

function providerUrlFor(name) {
  if (PROVIDER_URLS[name]) {
    return PROVIDER_URLS[name];
  }

  const normalized = name.toLowerCase().replace(RE_NON_ALPHANUMERIC, "");
  const alias = Object.entries(PROVIDER_URLS).find(([providerName]) => (
    providerName.toLowerCase().replace(RE_NON_ALPHANUMERIC, "") === normalized
  ));

  if (alias?.[1]) {
    return alias[1];
  }

  const compactName = compactProviderLabel(name);
  const compactNormalized = normalizeServiceName(compactName);
  const compactAlias = Object.entries(PROVIDER_URLS).find(([providerName]) => (
    providerName.toLowerCase().replace(RE_NON_ALPHANUMERIC, "") === compactNormalized
  ));

  if (compactAlias?.[1]) {
    return compactAlias[1];
  }

  const serviceKey = serviceKeyFor(compactName || name);
  return CANONICAL_PROVIDER_URLS_BY_KEY[serviceKey] || "";
}

function normalizeServiceName(name) {
  return String(name || "").toLowerCase().replace(RE_NON_ALPHANUMERIC, "");
}

function compactProviderLabel(name) {
  return String(name || "")
    .replace(/\s+Amazon Channel$/i, "")
    .replace(/\s+Free with Ads$/i, "")
    .replace(/\s+Standard with Ads$/i, "")
    .replace(/\s+with Ads$/i, "")
    .trim();
}

function inferredHomeServiceKey(name) {
  const normalized = normalizeServiceName(name);

  if (!normalized) {
    return "";
  }

  if (normalized.includes("netflix")) {
    return "netflix";
  }

  if (normalized.includes("disney")) {
    return "disneyplus";
  }

  if (
    normalized.includes("primevideo") ||
    normalized.includes("amazonprimevideo") ||
    normalized.includes("amazonvideo")
  ) {
    return "primevideo";
  }

  if (normalized.includes("appletv")) {
    return "appletv";
  }

  if (normalized === "max" || normalized.includes("hbomax") || normalized.includes("hbo")) {
    return "hbo";
  }

  if (normalized.includes("hulu")) {
    return "hulu";
  }

  if (normalized.includes("paramount")) {
    return "paramountplus";
  }

  if (normalized.includes("peacock")) {
    return "peacock";
  }

  if (normalized.includes("starz")) {
    return "starz";
  }

  if (normalized.includes("showtime")) {
    return "showtime";
  }

  if (normalized.includes("amc")) {
    return "amc";
  }

  if (normalized.includes("discovery")) {
    return "discoveryplus";
  }

  if (normalized.includes("crunchyroll")) {
    return "crunchyroll";
  }

  return normalized;
}

function serviceKeyFor(name) {
  const normalized = normalizeServiceName(name);
  return HOME_SERVICE_ALIAS_INDEX.get(normalized) || inferredHomeServiceKey(name);
}

function serviceNameForKey(key, fallback = "") {
  return HOME_SERVICE_BY_KEY.get(key)?.name || fallback || key;
}

function svgData(markup) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup.replace(/\s+/g, " ").trim())}`;
}

function tmdbLogoImageUrl(path, size = "w780", dark = "bababa") {
  if (!path) {
    return "";
  }

  return `${TMDB.imageBase}/${size}_filter(duotone,ffffff,${dark})${path}`;
}

function escapeSvgText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getToken() {
  return CONFIG.tmdbReadAccessToken || "";
}

function usesProxyAuth() {
  const apiBase = TMDB.apiBase || "";
  return apiBase.startsWith("/api/") || apiBase.startsWith("api/");
}

function hasToken() {
  return Boolean(getToken() || usesProxyAuth());
}

function keyFor(mediaType, id) {
  return `${mediaType}-${id}`;
}

function splitKey(key) {
  const [mediaType, id] = key.split("-");
  return { mediaType, id };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createUrl(path, params = {}) {
  const apiBase = String(TMDB.apiBase || "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const target = `${apiBase}${normalizedPath}`;
  const url = apiBase.startsWith("http://") || apiBase.startsWith("https://")
    ? new URL(target)
    : new URL(target, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

const CACHE_LIMITS = { item: 400, preview: 220, detail: 150, person: 80 };
const detailRequestCache = new Map();
const previewRequestCache = new Map();
const libraryTvdbToTmdbCache = new Map();
const libraryTvdbLookupCache = new Map();

function requestStateKey(tmdbId, mediaType) {
  return `${mediaType === "tv" ? "tv" : "movie"}:${tmdbId}`;
}

function requestServiceForMedia(mediaType) {
  return REQUEST_SERVICE_BY_MEDIA[mediaType === "tv" ? "tv" : "movie"];
}

function requestServiceLabel(serviceName) {
  return REQUEST_SERVICE_LABELS[serviceName] || serviceName;
}

function defaultRequestTroubleshooting(serviceName) {
  return [...(REQUEST_DEFAULT_TROUBLESHOOTING[serviceName] || [])];
}

function normalizeRequestTroubleshooting(steps, serviceName) {
  const normalized = Array.isArray(steps)
    ? steps.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  return normalized.length ? normalized : defaultRequestTroubleshooting(serviceName);
}

function setRequestServiceState(serviceName, patch = {}) {
  if (serviceName !== "radarr" && serviceName !== "sonarr") {
    return;
  }

  const previous = state.requestServices[serviceName] || {
    configured: false,
    connected: false,
    message: `${requestServiceLabel(serviceName)} status unavailable.`,
    troubleshooting: defaultRequestTroubleshooting(serviceName),
  };

  state.requestServices[serviceName] = {
    configured: patch.configured ?? previous.configured,
    connected: patch.connected ?? previous.connected,
    message: patch.message || previous.message,
    troubleshooting: patch.troubleshooting
      ? normalizeRequestTroubleshooting(patch.troubleshooting, serviceName)
      : previous.troubleshooting,
  };

  state.radarrConnected = Boolean(state.requestServices.radarr?.connected);
  state.sonarrConnected = Boolean(state.requestServices.sonarr?.connected);
}

function previewDetailForKey(key) {
  if (!key) {
    return null;
  }

  return state.detailCache.get(key) || state.previewCache.get(key) || null;
}

function rerenderRequestSurfaces() {
  if (state.view === "details" && state.selectedKey) {
    const detail = state.detailCache.get(state.selectedKey);
    if (detail) {
      renderDetails(detail);
    }
  }

  if (state.homePreviewKey) {
    const previewDetail = previewDetailForKey(state.homePreviewKey);
    if (previewDetail) {
      renderHomePreview(previewDetail);
    }
  }

  if (requestSurfaceRenderFrame) {
    return;
  }

  requestSurfaceRenderFrame = window.requestAnimationFrame(() => {
    requestSurfaceRenderFrame = 0;

    if (state.view === "home") {
      renderFeatured();
    }

    if (!resultsSection.hidden) {
      renderResults();
    }

    if (!heroSearchSuggestions.hidden && state.heroSuggestions.length) {
      renderSuggestions(heroSearchSuggestions, state.heroSuggestions);
    }

    if (!resultsSearchSuggestions.hidden && state.resultsSuggestions.length) {
      renderSuggestions(resultsSearchSuggestions, state.resultsSuggestions);
    }
  });
}

function requestRecordFor(detail) {
  if (!detail?.id) {
    return null;
  }

  return state.requestedItems.get(requestStateKey(detail.id, detail.mediaType));
}

function setRequestRecord(tmdbId, mediaType, record) {
  state.requestedItems.set(requestStateKey(tmdbId, mediaType), {
    ...record,
    timestamp: Date.now(),
  });
}

function clearRequestError() {
  state.requestError = null;
}

function requestTroubleshootingMarkup(steps) {
  if (!steps?.length) {
    return "";
  }

  return `
    <div class="request-troubleshooting">
      <p class="panel-kicker">Troubleshooting</p>
      <ol>
        ${steps.slice(0, 4).map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
      </ol>
    </div>
  `;
}

function getRequestUiState(detail) {
  const mediaType = detail?.mediaType === "tv" ? "tv" : "movie";
  const serviceName = requestServiceForMedia(mediaType);
  const service = state.requestServices[serviceName] || {
    configured: false,
    connected: false,
    message: `${requestServiceLabel(serviceName)} status unavailable.`,
    troubleshooting: defaultRequestTroubleshooting(serviceName),
  };
  const itemKey = requestStateKey(detail?.id, mediaType);
  const inProgress = state.requestInProgress.has(itemKey);
  const record = requestRecordFor(detail);
  const serviceUnavailable = state.requestServiceStatusLoaded && (!service.configured || !service.connected);

  if (record?.status === "removing") {
    return {
      kind: "removing",
      label: "Removing...",
      disabled: true,
      buttonClass: "is-loading",
      action: "remove",
      message: "",
      troubleshooting: [],
    };
  }

  if (inProgress) {
    return {
      kind: "loading",
      label: "Adding...",
      disabled: true,
      buttonClass: "is-loading",
      action: "add",
      message: "",
      troubleshooting: [],
    };
  }

  if (record?.status === "success") {
    return {
      kind: "success",
      label: "Added to queue ✓",
      disabled: true,
      buttonClass: "is-success",
      action: "add",
      message: record.message || "Added to queue.",
      troubleshooting: [],
    };
  }

  if (record?.status === "already_requested") {
    return {
      kind: "already_requested",
      label: "Remove from Library",
      disabled: false,
      buttonClass: "is-remove",
      action: "remove",
      message: record.message || "Already in your library. Remove it from your library if you no longer want it.",
      troubleshooting: [],
    };
  }

  if (serviceUnavailable) {
    return {
      kind: "service_down",
      label: `${requestServiceLabel(serviceName)} unavailable`,
      disabled: true,
      buttonClass: "is-unavailable",
      action: "add",
      message: service.message || `${requestServiceLabel(serviceName)} is unavailable right now.`,
      troubleshooting: normalizeRequestTroubleshooting(service.troubleshooting, serviceName),
    };
  }

  if (record?.status === "removed") {
    return {
      kind: "removed",
      label: "Request",
      disabled: false,
      buttonClass: "",
      action: "add",
      message: record.message || "Removed from your library.",
      troubleshooting: [],
    };
  }

  if (record?.status === "remove_error") {
    return {
      kind: "remove_error",
      label: "Remove failed - retry",
      disabled: false,
      buttonClass: "is-error",
      action: "remove",
      message: record.message || "Removal failed. Click to retry.",
      troubleshooting: normalizeRequestTroubleshooting(record.troubleshooting, serviceName),
    };
  }

  if (record?.status === "error") {
    return {
      kind: "error",
      label: "Failed - Click to retry",
      disabled: false,
      buttonClass: "is-error",
      action: "add",
      message: record.message || "Request failed. Click to retry.",
      troubleshooting: normalizeRequestTroubleshooting(record.troubleshooting, serviceName),
    };
  }

  return {
    kind: "idle",
    label: "Request",
    disabled: false,
    buttonClass: "",
    action: "add",
    message: "",
    troubleshooting: [],
  };
}

function compactRequestLabel(requestUi) {
  if (requestUi.kind === "removing") {
    return "Removing...";
  }
  if (requestUi.kind === "loading") {
    return "Adding...";
  }
  if (requestUi.kind === "already_requested" || requestUi.action === "remove") {
    return "Remove";
  }
  if (requestUi.kind === "success") {
    return "Queued ✓";
  }
  if (requestUi.kind === "service_down") {
    return "Unavailable";
  }
  if (requestUi.kind === "remove_error") {
    return "Retry remove";
  }
  if (requestUi.kind === "error") {
    return "Retry";
  }
  return "Request";
}

function compactRequestUiState(detail) {
  const requestUi = getRequestUiState(detail);
  return {
    ...requestUi,
    label: compactRequestLabel(requestUi),
  };
}

function mediaCardLibraryBadgeMarkup(item) {
  const mediaType = item?.mediaType === "tv" ? "tv" : "movie";
  const record = state.requestedItems.get(requestStateKey(item?.id, mediaType));
  if (record?.status !== "already_requested") {
    return "";
  }

  return `<span class="media-card-library-badge" aria-label="Already in your library" title="Already in your library">✓</span>`;
}

function mediaCardRequestActionMarkup(item) {
  const requestUi = compactRequestUiState(item);
  if (!requestUi) {
    return "";
  }

  return `
    <div class="media-card-actions">
      ${requestActionButtonMarkup(item, requestUi, "media-card-request-button")}
    </div>
  `;
}

function queueLibraryStatusChecks(items, limit = 20) {
  if (!Array.isArray(items) || !items.length) {
    return;
  }

  if (!state.requestServiceStatusLoaded) {
    return;
  }

  const candidates = items
    .filter((item) => Number.isFinite(Number(item?.id)))
    .filter((item) => {
      const mediaType = item.mediaType === "tv" ? "tv" : "movie";
      const serviceName = requestServiceForMedia(mediaType);
      const service = state.requestServices[serviceName];
      return Boolean(service?.configured && service?.connected);
    })
    .filter((item) => {
      const mediaType = item.mediaType === "tv" ? "tv" : "movie";
      const statusKey = requestStateKey(item.id, mediaType);
      const existing = state.requestedItems.get(statusKey);
      if (
        existing?.status === "success" ||
        existing?.status === "already_requested" ||
        existing?.status === "not_requested" ||
        existing?.status === "removed" ||
        existing?.status === "removing" ||
        existing?.status === "remove_error"
      ) {
        return false;
      }
      if (existing?.status === "status_error" && (Date.now() - (existing.timestamp || 0)) < REQUEST_STATUS_RETRY_DELAY_MS) {
        return false;
      }
      return !state.requestStatusChecks.has(statusKey);
    })
    .slice(0, limit);

  if (!candidates.length) {
    return;
  }

  candidates.forEach((item) => {
    void getRequestStatus(item.id, item.mediaType);
  });
}

function requestActionButtonMarkup(detail, requestUi, extraClass = "") {
  const className = ["action-button", "request-action-button", requestUi.buttonClass, extraClass]
    .filter(Boolean)
    .join(" ");
  const action = requestUi.action === "remove" ? "remove" : "add";

  return `
    <button class="${className}" type="button" data-request-title="${detail.key}" data-request-action="${action}" ${requestUi.disabled ? "disabled" : ""}>
      ${escapeHtml(requestUi.label)}
    </button>
  `;
}

function requestFeedbackMarkup(requestUi) {
  const toneClass = requestUi.kind === "error" || requestUi.kind === "service_down" || requestUi.kind === "remove_error"
    ? "is-error"
    : requestUi.kind === "success" || requestUi.kind === "already_requested" || requestUi.kind === "removed"
      ? "is-success"
      : "";

  const message = requestUi.message
    ? `<p class="detail-support-copy request-feedback ${toneClass}">${escapeHtml(requestUi.message)}</p>`
    : "";
  const troubleshooting = (requestUi.kind === "error" || requestUi.kind === "service_down" || requestUi.kind === "remove_error")
    ? requestTroubleshootingMarkup(requestUi.troubleshooting)
    : "";

  return { message, troubleshooting };
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function applyRequestServicePayload(payload, fallbackService = "") {
  const serviceName = payload?.service || fallbackService;
  if (serviceName !== "radarr" && serviceName !== "sonarr") {
    return;
  }

  const patch = {};

  if (typeof payload.configured === "boolean") {
    patch.configured = payload.configured;
  }
  if (typeof payload.available === "boolean") {
    patch.connected = payload.available;
  }
  if (payload.success === true) {
    patch.connected = true;
    if (patch.configured === undefined) {
      patch.configured = true;
    }
  }
  if (payload.code === "not_configured") {
    patch.configured = false;
    patch.connected = false;
  }
  if (payload.message) {
    patch.message = payload.message;
  }
  if (payload.troubleshooting) {
    patch.troubleshooting = payload.troubleshooting;
  }

  if (Object.keys(patch).length) {
    setRequestServiceState(serviceName, patch);
    state.requestServiceStatusLoaded = true;
  }
}

async function refreshRequestServiceStatus() {
  try {
    const response = await fetch("/health", {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Health endpoint returned status ${response.status}.`);
    }

    const health = await parseJsonResponse(response);
    if (!health?.requestServices || typeof health.requestServices !== "object") {
      throw new Error("Request service status payload is unavailable.");
    }
    const serviceData = health.requestServices;

    ["radarr", "sonarr"].forEach((serviceName) => {
      const status = serviceData[serviceName];
      if (!status) {
        return;
      }

      setRequestServiceState(serviceName, {
        configured: Boolean(status.configured),
        connected: Boolean(status.connected),
        message: status.message || `${requestServiceLabel(serviceName)} status unavailable.`,
        troubleshooting: normalizeRequestTroubleshooting(status.troubleshooting, serviceName),
      });
    });

    state.requestServiceStatusLoaded = true;
  } catch (_error) {
    const message = "Request API is unavailable in this runtime.";
    ["radarr", "sonarr"].forEach((serviceName) => {
      setRequestServiceState(serviceName, {
        configured: false,
        connected: false,
        message,
        troubleshooting: [
          "Start W.D.I.S. in serve mode so /api/request routes are available.",
          ...defaultRequestTroubleshooting(serviceName).slice(0, 2),
        ],
      });
    });
    state.requestServiceStatusLoaded = true;
  } finally {
    rerenderRequestSurfaces();
  }
}

async function getRequestStatus(tmdbId, mediaType) {
  const normalizedType = mediaType === "tv" ? "tv" : "movie";
  const statusKey = requestStateKey(tmdbId, normalizedType);

  const existing = state.requestedItems.get(statusKey);
  if (
    existing?.status === "success" ||
    existing?.status === "already_requested" ||
    existing?.status === "not_requested" ||
    existing?.status === "removed" ||
    existing?.status === "removing" ||
    existing?.status === "remove_error"
  ) {
    return;
  }

  if (existing?.status === "status_error" && (Date.now() - (existing.timestamp || 0)) < REQUEST_STATUS_RETRY_DELAY_MS) {
    return;
  }

  if (state.requestStatusChecks.has(statusKey)) {
    return state.requestStatusChecks.get(statusKey);
  }

  const checkPromise = (async () => {
    let shouldRerender = false;
    try {
      const params = new URLSearchParams({
        tmdbId: String(tmdbId),
        type: normalizedType,
      });
      const response = await fetch(`/api/request/status?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      const payload = await parseJsonResponse(response);

      applyRequestServicePayload(payload, requestServiceForMedia(normalizedType));

      if (payload?.requested) {
        setRequestRecord(tmdbId, normalizedType, {
          status: "already_requested",
          message: payload.message || "Already in your library.",
          service: payload.service || requestServiceForMedia(normalizedType),
          troubleshooting: normalizeRequestTroubleshooting(
            payload.troubleshooting,
            payload.service || requestServiceForMedia(normalizedType)
          ),
        });
        shouldRerender = true;
      } else if (payload?.requested === false && payload?.available !== false) {
        setRequestRecord(tmdbId, normalizedType, {
          status: "not_requested",
          message: "",
          service: payload.service || requestServiceForMedia(normalizedType),
          troubleshooting: normalizeRequestTroubleshooting(
            payload.troubleshooting,
            payload.service || requestServiceForMedia(normalizedType)
          ),
        });
      } else if (payload?.configured === false || payload?.available === false) {
        shouldRerender = true;
      }
    } catch {
      setRequestRecord(tmdbId, normalizedType, {
        status: "status_error",
        message: "",
        service: requestServiceForMedia(normalizedType),
        troubleshooting: defaultRequestTroubleshooting(requestServiceForMedia(normalizedType)),
      });
    } finally {
      state.requestStatusChecks.delete(statusKey);
      if (shouldRerender) {
        rerenderRequestSurfaces();
      }
    }
  })();

  state.requestStatusChecks.set(statusKey, checkPromise);
  return checkPromise;
}

async function submitRequest(tmdbId, mediaType, metadata = {}) {
  const normalizedType = mediaType === "tv" ? "tv" : "movie";
  const serviceName = requestServiceForMedia(normalizedType);
  const statusKey = requestStateKey(tmdbId, normalizedType);

  if (state.requestInProgress.has(statusKey)) {
    return;
  }

  clearRequestError();
  state.requestInProgress.set(statusKey, Date.now());
  rerenderRequestSurfaces();

  const endpoint = normalizedType === "tv" ? "/api/request/tv" : "/api/request/movie";
  const parsedYear = Number.parseInt(String(metadata.year || ""), 10);
  const payload = {
    tmdbId: Number(tmdbId),
    title: metadata.title || "",
    ...(Number.isFinite(parsedYear) ? { year: parsedYear } : {}),
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const body = await parseJsonResponse(response);
    applyRequestServicePayload(body, serviceName);

    if (!response.ok) {
      const message = body?.message || "Request failed. Please try again.";
      state.requestError = message;
      setRequestRecord(tmdbId, normalizedType, {
        status: "error",
        message,
        service: body?.service || serviceName,
        troubleshooting: normalizeRequestTroubleshooting(
          body?.troubleshooting,
          body?.service || serviceName
        ),
      });
      return;
    }

    if (body?.alreadyRequested || body?.success === false) {
      setRequestRecord(tmdbId, normalizedType, {
        status: "already_requested",
        message: body?.message || "Already in your library.",
        service: body?.service || serviceName,
        troubleshooting: normalizeRequestTroubleshooting(
          body?.troubleshooting,
          body?.service || serviceName
        ),
      });
      return;
    }

    setRequestRecord(tmdbId, normalizedType, {
      status: "success",
      message: body?.message || "Added to queue.",
      service: body?.service || serviceName,
      troubleshooting: normalizeRequestTroubleshooting(
        body?.troubleshooting,
        body?.service || serviceName
      ),
    });
  } catch {
    const message = "Could not reach the request API right now.";
    state.requestError = message;
    setRequestRecord(tmdbId, normalizedType, {
      status: "error",
      message,
      service: serviceName,
      troubleshooting: defaultRequestTroubleshooting(serviceName),
    });
  } finally {
    state.requestInProgress.delete(statusKey);
    rerenderRequestSurfaces();
  }
}

async function submitRemoval(tmdbId, mediaType, metadata = {}) {
  const normalizedType = mediaType === "tv" ? "tv" : "movie";
  const serviceName = requestServiceForMedia(normalizedType);
  const statusKey = requestStateKey(tmdbId, normalizedType);

  if (state.requestInProgress.has(statusKey)) {
    return;
  }

  clearRequestError();
  setRequestRecord(tmdbId, normalizedType, {
    status: "removing",
    message: "",
    service: serviceName,
    troubleshooting: [],
  });
  state.requestInProgress.set(statusKey, Date.now());
  rerenderRequestSurfaces();

  const endpoint = normalizedType === "tv" ? "/api/request/tv/remove" : "/api/request/movie/remove";
  const payload = {
    tmdbId: Number(tmdbId),
    title: metadata.title || "",
    year: metadata.year || "",
    deleteFiles: true,
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const body = await parseJsonResponse(response);
    applyRequestServicePayload(body, serviceName);

    if (!response.ok) {
      const message = body?.message || "Removal failed. Please try again.";
      state.requestError = message;
      setRequestRecord(tmdbId, normalizedType, {
        status: "remove_error",
        message,
        service: body?.service || serviceName,
        troubleshooting: normalizeRequestTroubleshooting(
          body?.troubleshooting,
          body?.service || serviceName
        ),
      });
      return;
    }

    if (body?.alreadyRemoved || body?.success === false) {
      setRequestRecord(tmdbId, normalizedType, {
        status: "not_requested",
        message: body?.message || "Not in your library.",
        service: body?.service || serviceName,
        troubleshooting: normalizeRequestTroubleshooting(
          body?.troubleshooting,
          body?.service || serviceName
        ),
      });
      return;
    }

    setRequestRecord(tmdbId, normalizedType, {
      status: "removed",
      message: body?.message || "Removed from your library.",
      service: body?.service || serviceName,
      troubleshooting: normalizeRequestTroubleshooting(
        body?.troubleshooting,
        body?.service || serviceName
      ),
    });
  } catch {
    const message = "Could not reach the request API right now.";
    state.requestError = message;
    setRequestRecord(tmdbId, normalizedType, {
      status: "remove_error",
      message,
      service: serviceName,
      troubleshooting: defaultRequestTroubleshooting(serviceName),
    });
  } finally {
    state.requestInProgress.delete(statusKey);
    rerenderRequestSurfaces();
  }
}

function setCached(cache, key, value, limit) {
  if (cache.size >= limit) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, value);
}

function debounce(fn, wait = 220) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
}

function mediaTypePath(mediaType) {
  return mediaType === "tv" ? "tv" : "movie";
}

function syncSearchControls() {
  const placeholder = "Try Inception, drama, or Netflix...";
  heroSearchInput.placeholder = placeholder;
  resultsSearchInput.placeholder = placeholder;
}

function formatSearchContextLabel(context = state.activeSearchContext) {
  if (context.mode === "genre" && context.genreName) {
    return context.genreName;
  }

  if (context.mode === "service" && context.serviceName) {
    return context.serviceName;
  }

  if (context.mode === "title" && context.query) {
    return `"${context.query}"`;
  }

  return "live trending titles";
}

function scrollViewportTop() {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
}

function scrollResultsIntoView() {
  if (!resultsSection) {
    return;
  }

  resultsSection.scrollIntoView({
    block: "start",
    behavior: prefersReducedMotion.matches ? "auto" : "smooth",
  });
}

function scrollFeaturedIntoView() {
  if (!homeFeaturedSection) {
    return;
  }

  homeFeaturedSection.scrollIntoView({
    block: "start",
    behavior: prefersReducedMotion.matches ? "auto" : "smooth",
  });
}

function revealResultsSection(title = "Showing results", summary = "") {
  resultsSection.hidden = false;
  resultsTitle.textContent = title;
  resultsSummary.textContent = summary;
}

function emphasizeFeaturedSection() {
  if (!homeFeaturedSection || prefersReducedMotion.matches) {
    return;
  }

  homeFeaturedSection.classList.remove("is-emphasized");
  void homeFeaturedSection.offsetWidth;
  homeFeaturedSection.classList.add("is-emphasized");
  window.setTimeout(() => {
    homeFeaturedSection.classList.remove("is-emphasized");
  }, 900);
}

function currentHomepageGenreLabel() {
  return state.genre === "Trending" ? "Trending" : state.genre;
}

function renderHomepageGenreCue() {
  const genreLabel = currentHomepageGenreLabel();
  const isTrending = genreLabel === "Trending";

  if (genreFilterStatus) {
    genreFilterStatus.textContent = isTrending
      ? "Trending is shaping Tonight's best bets below."
      : `${genreLabel} is shaping Tonight's best bets below.`;
  }

  if (genreJumpLink) {
    genreJumpLink.textContent = isTrending
      ? "Jump to picks"
      : `Jump to ${genreLabel} picks`;
  }

  if (homeFeaturedEyebrow) {
    homeFeaturedEyebrow.textContent = isTrending ? "Trending now" : `${genreLabel} now`;
  }

  if (homeFeaturedTitle) {
    homeFeaturedTitle.textContent = isTrending
      ? "Tonight's best bets"
      : `Tonight's best ${genreLabel.toLowerCase()} bets`;
  }

  if (homeFeaturedSummary) {
    homeFeaturedSummary.textContent = isTrending
      ? "Start with a mood or a streamer, then browse live movie and series picks without leaving the homepage."
      : `The mood chips above are currently steering both movie and TV picks toward ${genreLabel.toLowerCase()} titles.`;
  }
}

function resetHomepageToTrendingContext({ clearInputs = false } = {}) {
  state.query = "";
  state.resultsMode = "trending";
  state.resultsGenre = "";
  state.resultsType = "All Results";
  state.activeSearchContext = {
    mode: "trending",
    query: "",
    genreName: "",
    serviceKey: "",
    serviceName: "",
    mediaType: "all",
  };

  if (clearInputs) {
    heroSearchInput.value = "";
    resultsSearchInput.value = "";
  }
}

function youTubeEmbedUrl(videoKey) {
  if (!videoKey) {
    return "";
  }

  const url = new URL(`https://www.youtube-nocookie.com/embed/${videoKey}`);
  url.searchParams.set("rel", "0");
  url.searchParams.set("modestbranding", "1");
  url.searchParams.set("playsinline", "1");

  if (window.location.protocol !== "file:") {
    url.searchParams.set("origin", window.location.origin);
  }

  return url.toString();
}

async function tmdbFetch(path, params = {}, { signal = null, timeout = 15000 } = {}) {
  const token = getToken();

  if (!token && !usesProxyAuth()) {
    throw new Error("Streaming data is not configured yet.");
  }

  let timeoutId = null;
  let internalController = null;
  let fetchSignal = signal;

  if (!signal && timeout > 0) {
    internalController = new AbortController();
    fetchSignal = internalController.signal;
    timeoutId = setTimeout(() => internalController.abort(), timeout);
  }

  try {
    const response = await fetch(createUrl(path, params), {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          }
        : {
            Accept: "application/json",
          },
      signal: fetchSignal,
    });

    if (response.status === 429) {
      const retryAfterSec = Number(response.headers.get("Retry-After") || 2);
      await new Promise((resolve) => setTimeout(resolve, retryAfterSec * 1000));
      const retry = await fetch(createUrl(path, params), {
        headers: token
          ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
          : { Accept: "application/json" },
        signal: fetchSignal,
      });
      if (!retry.ok) {
        throw new Error(`The streaming data service returned status ${retry.status}.`);
      }
      return retry.json();
    }

    if (!response.ok) {
      const message = response.status === 401
        ? "The streaming data service rejected the current credentials."
        : `The streaming data service returned status ${response.status}.`;
      throw new Error(message);
    }

    return response.json();
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
}

function imageUrl(path, size = TMDB.posterSize) {
  if (!path) {
    return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80";
  }
  return `${TMDB.imageBase}/${size}${path}`;
}

function mediaLabel(item) {
  return item.mediaType === "tv" ? "Series" : "Movie";
}

function yearLabel(item) {
  const raw = item.release_date || item.first_air_date || "";
  return raw ? raw.slice(0, 4) : "TBD";
}

function genreLabel(item) {
  const ids = item.genre_ids || [];
  const lookup = item.mediaType === "tv" ? state.genres.tv : state.genres.movie;
  return ids.map((id) => lookup.get(id)).find(Boolean) || mediaLabel(item);
}

function normalizeSummary(item) {
  const mediaType = item.media_type === "tv" || item.mediaType === "tv" ? "tv" : "movie";
  const releaseDateRaw = item.releaseDateRaw || item.release_date || item.first_air_date || "";
  const voteAverage = Number(item.vote_average ?? item.voteAverage ?? 0);
  const voteCount = Number(item.vote_count ?? item.voteCount ?? 0);
  const genreIds = Array.isArray(item.genre_ids)
    ? item.genre_ids
    : Array.isArray(item.genreIds)
      ? item.genreIds
      : Array.isArray(item.genres)
        ? item.genres.map((genre) => genre.id).filter(Boolean)
        : [];
  const normalized = {
    id: item.id,
    mediaType,
    key: keyFor(mediaType, item.id),
    title: item.title || item.name || "Untitled",
    type: mediaType === "tv" ? "Series" : "Movie",
    year: yearLabel({ ...item, mediaType }),
    genre: genreLabel({ ...item, mediaType }),
    rating: voteAverage ? voteAverage.toFixed(1) : "NR",
    voteAverage,
    voteCount,
    popularity: Number(item.popularity || 0),
    genreIds,
    releaseDateRaw,
    availability: "Open details for streaming options",
    providers: [],
    image: imageUrl(item.poster_path || item.backdrop_path),
    backdrop: imageUrl(item.backdrop_path || item.poster_path, TMDB.backdropSize),
    overview: item.overview || "No synopsis is available yet.",
  };

  setCached(state.itemCache, normalized.key, normalized, CACHE_LIMITS.item);
  return normalized;
}

function clampNumber(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function logarithmicSignal(value, ceiling) {
  if (!value || value <= 0) {
    return 0;
  }

  return clampNumber(Math.log10(value + 1) / Math.log10(ceiling + 1));
}

function releaseDateForItem(item) {
  return item?.releaseDateRaw || item?.release_date || item?.first_air_date || "";
}

function releaseYearNumber(item) {
  const raw = releaseDateForItem(item) || item?.year || "";
  const year = Number.parseInt(String(raw).slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

function releaseAgeYears(item) {
  const raw = releaseDateForItem(item);
  if (!raw) {
    return null;
  }

  const releasedAt = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(releasedAt.getTime())) {
    return null;
  }

  return (Date.now() - releasedAt.getTime()) / (365.25 * 86400000);
}

function freshnessSignal(item) {
  const ageYears = releaseAgeYears(item);
  if (ageYears === null) {
    return 0.55;
  }

  if (ageYears < 0) {
    return 0.1;
  }

  if (ageYears <= 1.5) {
    return 1;
  }

  if (ageYears <= 4) {
    return 0.9;
  }

  if (ageYears <= 10) {
    return 0.78;
  }

  if (ageYears <= 20) {
    return 0.68;
  }

  return 0.58;
}

function availabilitySignal(item) {
  const primaryProvider = preferredProvider(item.providers || []);
  if (!primaryProvider) {
    return 0;
  }

  if (primaryProvider.accessType === "stream") {
    return 1;
  }

  if (primaryProvider.accessType === "ad-supported") {
    return 0.92;
  }

  if (primaryProvider.accessType === "rent" || primaryProvider.accessType === "buy") {
    return 0.55;
  }

  return 0.35;
}

function genreDiversityKey(item) {
  if (Array.isArray(item.genreIds) && item.genreIds.length) {
    return String(item.genreIds[0]);
  }

  return normalizeServiceName(item.genre || "");
}

function providerDiversityKey(item) {
  const providers = item.providers || [];
  const primaryProvider = (
    providers.find((provider) => provider.accessType === "stream" || provider.accessType === "ad-supported") ||
    providers[0] ||
    null
  );

  return primaryProvider ? serviceKeyFor(primaryProvider.name) : "";
}

function yearBucketFor(item) {
  const year = releaseYearNumber(item);
  if (!year) {
    return "";
  }

  return `${Math.floor(year / 5) * 5}`;
}

function baseRecommendationScore(item) {
  const voteAverageRaw = item.voteAverage ?? Number.parseFloat(item.rating) ?? 0;
  const voteAverage = Number.isFinite(Number(voteAverageRaw)) ? Number(voteAverageRaw) : 0;
  const voteCount = Number.isFinite(Number(item.voteCount)) ? Number(item.voteCount) : 0;
  const popularity = Number.isFinite(Number(item.popularity)) ? Number(item.popularity) : 0;
  const ratingSignal = clampNumber((voteAverage - 5.5) / 3.3);
  const confidenceSignal = logarithmicSignal(voteCount, 15000);
  const popularitySignal = logarithmicSignal(popularity, 1200);
  const freshness = freshnessSignal(item);
  const availability = availabilitySignal(item);

  let score =
    (ratingSignal * 5.2) +
    (confidenceSignal * 2.4) +
    (popularitySignal * 1.4) +
    (freshness * 0.9) +
    (availability * 0.9);

  if (voteAverage >= 8 && voteCount >= 500) {
    score += 0.75;
  } else if (voteAverage >= 7.5 && voteCount >= 200) {
    score += 0.35;
  }

  if (voteCount >= 150 && voteAverage < 6.4) {
    score -= 1.4;
  }

  if (voteCount >= 60 && voteAverage < 6.0) {
    score -= 1.2;
  }

  if (!voteCount && voteAverage < 7.0) {
    score -= 0.4;
  }

  return score;
}

function recommendationScore(item, { activeServiceKey = "", referenceItem = null } = {}) {
  let score = baseRecommendationScore(item);

  if (
    activeServiceKey &&
    activeServiceKey !== "all" &&
    (item.providers || []).some((provider) => serviceKeyFor(provider.name) === activeServiceKey)
  ) {
    score += 0.45;
  }

  if (referenceItem) {
    const itemGenre = genreDiversityKey(item);
    const referenceGenre = genreDiversityKey(referenceItem);
    const itemProvider = providerDiversityKey(item);
    const referenceProvider = providerDiversityKey(referenceItem);
    const itemYear = releaseYearNumber(item);
    const referenceYear = releaseYearNumber(referenceItem);

    if (itemGenre && referenceGenre && itemGenre === referenceGenre) {
      score += 0.4;
    }

    if (itemProvider && referenceProvider && itemProvider === referenceProvider) {
      score += 0.15;
    }

    if (itemYear && referenceYear && Math.abs(itemYear - referenceYear) <= 8) {
      score += 0.15;
    }
  }

  return score;
}

function sortByRecommendationScore(items, options = {}) {
  const seen = new Set();

  return [...items]
    .filter((item) => {
      if (!item || seen.has(item.key)) {
        return false;
      }

      seen.add(item.key);
      return true;
    })
    .sort((left, right) => (
      recommendationScore(right, options) - recommendationScore(left, options) ||
      Number(right.voteAverage || 0) - Number(left.voteAverage || 0) ||
      Number(right.voteCount || 0) - Number(left.voteCount || 0) ||
      Number(right.popularity || 0) - Number(left.popularity || 0) ||
      left.title.localeCompare(right.title)
    ));
}

function rankCuratedItems(items, options = {}) {
  const ordered = sortByRecommendationScore(items, options);
  if (!ordered.length || options.diversify === false) {
    return ordered;
  }

  const remaining = ordered.map((item) => ({
    item,
    baseScore: recommendationScore(item, options),
  }));
  const ranked = [];
  const genreCounts = new Map();
  const providerCounts = new Map();
  const yearCounts = new Map();
  const genrePenaltyStep = options.referenceItem ? 0.18 : 0.35;
  const providerPenaltyStep = options.referenceItem ? 0.16 : 0.28;
  const yearPenaltyStep = options.referenceItem ? 0.1 : 0.18;

  // Keep each row varied so strong titles do not collapse into one genre/provider cluster.
  while (remaining.length) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    remaining.forEach((candidate, index) => {
      const genreKey = genreDiversityKey(candidate.item);
      const providerKey = providerDiversityKey(candidate.item);
      const yearKey = yearBucketFor(candidate.item);
      const adjustedScore =
        candidate.baseScore -
        ((genreCounts.get(genreKey) || 0) * genrePenaltyStep) -
        ((providerCounts.get(providerKey) || 0) * providerPenaltyStep) -
        ((yearCounts.get(yearKey) || 0) * yearPenaltyStep);

      if (adjustedScore > bestScore) {
        bestScore = adjustedScore;
        bestIndex = index;
      }
    });

    const [selected] = remaining.splice(bestIndex, 1);
    ranked.push(selected.item);

    const genreKey = genreDiversityKey(selected.item);
    const providerKey = providerDiversityKey(selected.item);
    const yearKey = yearBucketFor(selected.item);

    if (genreKey) {
      genreCounts.set(genreKey, (genreCounts.get(genreKey) || 0) + 1);
    }

    if (providerKey) {
      providerCounts.set(providerKey, (providerCounts.get(providerKey) || 0) + 1);
    }

    if (yearKey) {
      yearCounts.set(yearKey, (yearCounts.get(yearKey) || 0) + 1);
    }
  }

  return ranked;
}

function normalizeCast(credits, mediaType) {
  const cast = mediaType === "tv" ? credits.cast || [] : credits.cast || [];

  return cast.slice(0, 8).map((person) => ({
    id: person.id,
    name: person.name,
    knownForDepartment: person.known_for_department || "Cast",
    role: person.character || person.roles?.[0]?.character || "Cast",
    image: imageUrl(person.profile_path, TMDB.profileSize),
  }));
}

function crewPriority(person) {
  const job = (person.job || person.jobs?.[0]?.job || "").toLowerCase();
  const department = (person.department || "").toLowerCase();

  if (job.includes("director")) {
    return 1;
  }

  if (job.includes("writer") || job.includes("screenplay") || job.includes("story")) {
    return 2;
  }

  if (job.includes("producer")) {
    return 3;
  }

  if (department.includes("writing")) {
    return 4;
  }

  if (department.includes("production")) {
    return 5;
  }

  if (department.includes("directing")) {
    return 6;
  }

  if (department.includes("sound") || department.includes("camera") || department.includes("editing")) {
    return 7;
  }

  return 10;
}

function normalizeCrew(credits) {
  return (credits.crew || [])
    .filter((person) => person.profile_path)
    .sort((left, right) => crewPriority(left) - crewPriority(right))
    .slice(0, 8)
    .map((person) => ({
      id: person.id,
      name: person.name,
      knownForDepartment: person.known_for_department || person.department || "Crew",
      role: person.job || person.jobs?.[0]?.job || person.department || "Crew",
      image: imageUrl(person.profile_path, TMDB.profileSize),
    }));
}

function ratingForRegion(detail, ratings, mediaType) {
  if (mediaType === "movie") {
    const matches = ratings.results || [];
    const us = matches.find((entry) => entry.iso_3166_1 === TMDB.region);
    const certification = us?.release_dates?.find((entry) => entry.certification)?.certification;
    return certification || "NR";
  }

  const matches = ratings.results || [];
  const us = matches.find((entry) => entry.iso_3166_1 === TMDB.region);
  return us?.rating || detail.content_ratings?.results?.find((entry) => entry.iso_3166_1 === TMDB.region)?.rating || "NR";
}

function runtimeLabel(detail, mediaType) {
  if (mediaType === "movie") {
    if (!detail.runtime) {
      return "Runtime unavailable";
    }
    const hours = Math.floor(detail.runtime / 60);
    const minutes = detail.runtime % 60;
    return `${hours}h ${minutes}m`;
  }

  return `${detail.number_of_seasons || 1} season${detail.number_of_seasons === 1 ? "" : "s"}`;
}

function joinNaturalList(values = []) {
  const items = values.filter(Boolean);
  if (!items.length) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function formatUsd(value) {
  if (!value) {
    return "Not disclosed";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function originalLanguageLabel(detail) {
  const originalCode = detail.original_language || "";
  const spokenMatch =
    detail.spoken_languages?.find((language) => language.iso_639_1 === originalCode) ||
    detail.spoken_languages?.[0];

  return spokenMatch?.english_name || spokenMatch?.name || originalCode.toUpperCase() || "Unknown";
}

function productionRegionLabel(detail) {
  const countries =
    detail.production_countries?.map((country) => country.name).filter(Boolean) ||
    detail.origin_country?.filter(Boolean) ||
    [];

  return countries.length ? joinNaturalList(countries.slice(0, 3)) : "Unknown";
}

function buildDetailInsights(detail, mediaType) {
  const baseInsights = [
    {
      label: "Original title",
      value: detail.original_title || detail.original_name || detail.title || detail.name || "Unknown",
    },
    {
      label: "Original language",
      value: originalLanguageLabel(detail),
    },
    {
      label: "Genre mix",
      value: joinNaturalList(detail.genres?.map((genre) => genre.name).filter(Boolean) || []) || "Unknown",
    },
    {
      label: "Made in",
      value: productionRegionLabel(detail),
    },
  ];

  if (mediaType === "movie") {
    baseInsights.push(
      {
        label: "Runtime",
        value: runtimeLabel(detail, mediaType),
      },
      {
        label: "Budget",
        value: formatUsd(detail.budget),
      },
      {
        label: "Box office",
        value: formatUsd(detail.revenue),
      }
    );
  } else {
    const episodeRuntime = detail.episode_run_time?.find(Boolean);

    baseInsights.push(
      {
        label: "Seasons",
        value: `${detail.number_of_seasons || 0}`,
      },
      {
        label: "Episodes",
        value: `${detail.number_of_episodes || 0}`,
      },
      {
        label: "Episode runtime",
        value: episodeRuntime ? `${episodeRuntime} min` : "Varies",
      }
    );
  }

  return baseInsights;
}

function normalizeProviders(providerResponse) {
  const region = providerResponse.results?.[TMDB.region] || {};
  const order = [
    ...(region.flatrate || []).map((provider) => ({ ...provider, accessType: "stream" })),
    ...(region.ads || []).map((provider) => ({ ...provider, accessType: "ad-supported" })),
    ...(region.rent || []).map((provider) => ({ ...provider, accessType: "rent" })),
    ...(region.buy || []).map((provider) => ({ ...provider, accessType: "buy" })),
  ];

  const seen = new Set();

  return order
    .filter((provider) => {
      const include = !seen.has(provider.provider_id);
      seen.add(provider.provider_id);
      return include;
    })
    .map((provider) => ({
      name: provider.provider_name,
      providerId: provider.provider_id,
      note: providerUrlFor(provider.provider_name)
        ? `${accessTypeLabel(provider.accessType)} on service`
        : "Streaming service link unavailable",
      logoPath: provider.logo_path || "",
      logo: provider.logo_path ? imageUrl(provider.logo_path, "w185") : "",
      link: providerUrlFor(provider.provider_name),
      linkLabel: accessTypeLabel(provider.accessType),
      accessType: provider.accessType,
    }));
}

function preferredProvider(providers) {
  return (
    providers.find((provider) => provider.accessType === "stream" || provider.accessType === "ad-supported") ||
    providers.find((provider) => provider.accessType === "rent" || provider.accessType === "buy") ||
    null
  );
}

function accessTypeLabel(accessType) {
  if (accessType === "stream") {
    return "Stream";
  }

  if (accessType === "ad-supported") {
    return "Stream with ads";
  }

  if (accessType === "rent") {
    return "Rent";
  }

  if (accessType === "buy") {
    return "Buy";
  }

  return "Watch";
}

function hasSupportedAvailability(providers) {
  return providers.some(
    (provider) =>
      provider.accessType === "stream" ||
      provider.accessType === "ad-supported" ||
      provider.accessType === "rent" ||
      provider.accessType === "buy"
  );
}

function releaseDateValue(detail) {
  return detail.releaseDateRaw || detail.release_date || detail.first_air_date || "";
}

function daysFromToday(dateString) {
  if (!dateString) {
    return null;
  }

  const target = new Date(`${dateString}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

function fallbackAvailability(detail, mediaType, providers) {
  const streamProviders = providers.filter((provider) => provider.accessType === "stream" || provider.accessType === "ad-supported");
  const buyProviders = providers.filter((provider) => provider.accessType === "buy" || provider.accessType === "rent");
  const releaseDate = releaseDateValue(detail);
  const daysUntil = daysFromToday(releaseDate);

  if (streamProviders.length) {
    return {
      label: "Streaming availability found",
      heading: "Where to watch",
      message: "Available to stream now.",
      providers: streamProviders,
      actionLabel: streamProviders[0]?.link ? "Watch Now" : "",
      actionLink: streamProviders[0]?.link || "",
    };
  }

  if (daysUntil !== null && daysUntil > 0) {
    return {
      label: `Releases ${releaseDate}`,
      heading: "Coming soon",
      message: `This title does not appear to be released yet. Expected release date: ${releaseDate}.`,
      providers: [],
      actionLabel: "",
      actionLink: "",
    };
  }

  if (mediaType === "movie" && detail.status === "Released" && daysUntil !== null && daysUntil >= -45 && !buyProviders.length) {
    const query = encodeURIComponent(detail.title || detail.name || "");
    return {
      label: "Showtimes available",
      heading: "Showtimes",
      message: "Streaming is not listed yet. Check current theatrical showtimes for this movie.",
      providers: [],
      actionLabel: "View showtimes",
      actionLink: `https://www.fandango.com/search?q=${query}&mode=general`,
    };
  }

  if (buyProviders.length) {
    return {
      label: "Buy or rent available",
      heading: "Buy or rent",
      message: "This title is not streaming right now, but it appears to be available to buy or rent.",
      providers: buyProviders,
      actionLabel: buyProviders[0]?.link ? "Buy or Rent" : "",
      actionLink: buyProviders[0]?.link || "",
    };
  }

  return {
    label: "No US availability listed",
    heading: "Availability unknown",
    message: "No streaming, theatrical, or buy/rent availability was returned for this title in the US.",
    providers: [],
    actionLabel: "",
    actionLink: "",
  };
}

function availabilityLabel(detail, mediaType, providers) {
  return fallbackAvailability(detail, mediaType, providers).label;
}

async function attachProviders(items, limit = items.length, concurrency = 8, { signal = null } = {}) {
  const targetItems = items.slice(0, limit);
  const abortError = () => {
    const error = new Error("The request was aborted.");
    error.name = "AbortError";
    return error;
  };

  const fetchOne = async (item) => {
    if (signal?.aborted) {
      throw abortError();
    }

    try {
      const providersData = await tmdbFetch(`/${item.mediaType}/${item.id}/watch/providers`, {}, { signal });
      const providers = normalizeProviders(providersData);
      item.providers = providers;
      item.availability = providers.some((provider) => provider.accessType === "stream" || provider.accessType === "ad-supported")
        ? "Streaming availability found"
        : providers.some((provider) => provider.accessType === "buy" || provider.accessType === "rent")
          ? "Buy or rent available"
          : "Unavailable";
      item.isAvailable = hasSupportedAvailability(providers);
      setCached(state.itemCache, item.key, item, CACHE_LIMITS.item);
    } catch (error) {
      if (error?.name === "AbortError") {
        throw error;
      }

      item.providers = [];
      item.isAvailable = false;
    }
  };

  for (let i = 0; i < targetItems.length; i += concurrency) {
    if (signal?.aborted) {
      throw abortError();
    }

    await Promise.all(targetItems.slice(i, i + concurrency).map(fetchOne));
  }
}

async function fetchConfiguration() {
  const config = await tmdbFetch("/configuration");
  if (config.images?.secure_base_url) {
    TMDB.imageBase = config.images.secure_base_url.replace(/\/$/, "");
  }
}

async function fetchGenres() {
  const [movieGenres, tvGenres] = await Promise.all([
    tmdbFetch("/genre/movie/list", { language: TMDB.language }),
    tmdbFetch("/genre/tv/list", { language: TMDB.language }),
  ]);

  state.genres.movie = new Map(movieGenres.genres.map((genre) => [genre.id, genre.name]));
  state.genres.tv = new Map(tvGenres.genres.map((genre) => [genre.id, genre.name]));
}

async function fetchTrendingPage(page) {
  const data = await tmdbFetch("/trending/all/week", { language: TMDB.language, page });
  const items = (data.results || [])
    .filter((item) => item.media_type === "movie" || item.media_type === "tv")
    .map(normalizeSummary);

  await attachProviders(items, items.length);
  return {
    items: items.filter((item) => item.isAvailable),
    totalPages: data.total_pages || page,
  };
}

async function fetchTrending() {
  const { items, totalPages } = await fetchTrendingPage(1);
  state.featuredItems = items;
  state.resultsItems = items;
  state.activeSearchContext = {
    mode: "trending",
    query: "",
    genreName: "",
    serviceKey: "",
    serviceName: "",
    mediaType: "all",
  };
  state.trendingPageLoaded = 1;
  state.trendingHasMore = state.trendingPageLoaded < totalPages;
  state.resultsPageLoaded = 1;
  state.resultsHasMore = state.trendingHasMore;
  state.homeServiceFilterOffset = 0;

  if (!state.selectedKey) {
    state.selectedKey = items[0]?.key || null;
  }
}

async function loadNextTrendingPage() {
  if (state.trendingLoadingMore || !state.trendingHasMore) {
    return false;
  }

  state.trendingLoadingMore = true;

  try {
    const nextPage = state.trendingPageLoaded + 1;
    const { items, totalPages } = await fetchTrendingPage(nextPage);

    const existingKeys = new Set(state.featuredItems.map((item) => item.key));
    const newItems = items.filter((item) => !existingKeys.has(item.key));

    state.featuredItems = [...state.featuredItems, ...newItems];
    state.resultsItems = [...state.resultsItems, ...newItems];
    state.trendingPageLoaded = nextPage;
    state.trendingHasMore = state.trendingPageLoaded < totalPages;

    return newItems.length > 0 || state.trendingHasMore;
  } finally {
    state.trendingLoadingMore = false;
  }
}

async function loadMoreTrendingIfNeeded(type, requiredCount) {
  while (featuredByType(type).length < requiredCount && state.trendingHasMore) {
    const loadedPage = await loadNextTrendingPage();
    if (!loadedPage) {
      break;
    }
  }
}

async function runSearch(query) {
  const trimmed = query.trim();
  const mediaType = "all";
  const genreMatch = resolveGenreQuery(trimmed, mediaType);
  const serviceMatch = resolveServiceQuery(trimmed);
  const mode = genreMatch ? "genre" : serviceMatch ? "service" : "title";
  state.query = trimmed;
  resetResultsPaging();
  state.genre = "Trending";
  state.resultsGenre = "";
  state.resultsType = "All Results";
  state.resultsMode = trimmed ? "search-title" : "trending";
  resultsSearchInput.value = trimmed;
  heroSearchInput.value = trimmed;

  const loadingLabel = mode === "genre"
    ? `Finding ${trimmed.toLowerCase()} picks...`
    : mode === "service"
      ? `Checking ${trimmed} availability...`
      : `Searching for "${trimmed}"...`;

  setLoading(resultsGrid, trimmed ? loadingLabel : "Loading trending titles...");

  if (!trimmed) {
    state.activeSearchContext = {
      mode: "trending",
      query: "",
      genreName: "",
      serviceKey: "",
      serviceName: "",
      mediaType: "all",
    };
    await fetchTrending();
    renderResults();
    return;
  }

  if (mode === "genre") {
    const canonicalGenre = genreMatch.label;
    const firstPage = await fetchGenreSearchPage(canonicalGenre, 1, mediaType);
    state.query = canonicalGenre;
    state.genre = canonicalGenre;
    state.resultsGenre = canonicalGenre;
    state.resultsMode = "genre";
    state.activeSearchContext = {
      mode: "genre",
      query: canonicalGenre,
      genreName: canonicalGenre,
      serviceKey: "",
      serviceName: "",
      mediaType,
    };
    state.resultsItems = firstPage.items;
    state.resultsPageLoaded = firstPage.page;
    state.resultsHasMore = firstPage.page < firstPage.totalPages;
    resultsSearchInput.value = canonicalGenre;
    heroSearchInput.value = canonicalGenre;

    while (state.resultsItems.length < 18 && state.resultsHasMore) {
      const nextPage = state.resultsPageLoaded + 1;
      const nextResults = await fetchGenreSearchPage(canonicalGenre, nextPage, mediaType);
      const existingKeys = new Set(state.resultsItems.map((item) => item.key));
      const newItems = nextResults.items.filter((item) => !existingKeys.has(item.key));

      state.resultsItems = [...state.resultsItems, ...newItems];
      state.resultsPageLoaded = nextResults.page;
      state.resultsHasMore = nextResults.page < nextResults.totalPages;
    }
    return;
  }

  if (mode === "service") {
    const firstPage = await fetchServiceSearchPage(serviceMatch, 1, mediaType);
    state.query = serviceMatch.name;
    state.resultsMode = "search-service";
    state.activeSearchContext = {
      mode: "service",
      query: serviceMatch.name,
      genreName: "",
      serviceKey: serviceMatch.key,
      serviceName: serviceMatch.name,
      mediaType,
    };
    state.resultsItems = firstPage.items;
    state.resultsPageLoaded = firstPage.page;
    state.resultsHasMore = firstPage.page < firstPage.totalPages;
    resultsSearchInput.value = serviceMatch.name;
    heroSearchInput.value = serviceMatch.name;

    while (state.resultsItems.length < 18 && state.resultsHasMore) {
      const nextPage = state.resultsPageLoaded + 1;
      const nextResults = await fetchServiceSearchPage(serviceMatch, nextPage, mediaType);
      const existingKeys = new Set(state.resultsItems.map((item) => item.key));
      const newItems = nextResults.items.filter((item) => !existingKeys.has(item.key));

      state.resultsItems = [...state.resultsItems, ...newItems];
      state.resultsPageLoaded = nextResults.page;
      state.resultsHasMore = nextResults.page < nextResults.totalPages;
    }
    return;
  }

  const firstPage = await fetchTitleSearchPage(trimmed, 1, mediaType);
  state.resultsItems = firstPage.items;
  state.resultsPageLoaded = firstPage.page;
  state.resultsHasMore = firstPage.page < firstPage.totalPages;
  state.activeSearchContext = {
    mode: "title",
    query: trimmed,
    genreName: "",
    serviceKey: "",
    serviceName: "",
    mediaType,
  };
}

async function fetchSearchPage(query, page, mediaType = state.activeSearchContext.mediaType || "all") {
  return fetchTitleSearchPage(query, page, mediaType);
}

async function fetchGenrePage(genreName, page, mediaType = "all") {
  return fetchGenreSearchPage(genreName, page, mediaType);
}

async function discoverGenre(genreName) {
  const mediaType = "all";
  state.query = "";
  state.genre = genreName;
  state.resultsMode = genreName === "Trending" ? "trending" : "genre";
  state.resultsGenre = genreName === "Trending" ? "" : genreName;
  state.resultsType = "All Results";
  state.resultsPageLoaded = 0;
  state.resultsHasMore = true;
  state.resultsLoadingMore = false;
  state.resultsAutoLoadCount = 0;
  state.activeSearchContext = genreName === "Trending"
    ? {
        mode: "trending",
        query: "",
        genreName: "",
        serviceKey: "",
        serviceName: "",
        mediaType: "all",
      }
    : {
        mode: "genre",
        query: genreName,
        genreName,
        serviceKey: "",
        serviceName: "",
        mediaType,
      };
  resultsSearchInput.value = genreName === "Trending" ? "" : genreName;
  heroSearchInput.value = genreName === "Trending" ? "" : genreName;
  syncSearchControls();

  setLoading(resultsGrid, genreName === "Trending" ? "Loading trending titles..." : `Finding more ${genreName.toLowerCase()} titles...`);

  if (genreName === "Trending") {
    await fetchTrending();
    return;
  }

  const firstPage = await fetchGenrePage(genreName, 1, mediaType);
  state.resultsItems = firstPage.items;
  state.resultsPageLoaded = firstPage.page;
  state.resultsHasMore = firstPage.page < firstPage.totalPages;

  while (state.resultsItems.length < 18 && state.resultsHasMore) {
    const nextPage = state.resultsPageLoaded + 1;
    const nextResults = await fetchGenrePage(genreName, nextPage, mediaType);
    const existingKeys = new Set(state.resultsItems.map((item) => item.key));
    const newItems = nextResults.items.filter((item) => !existingKeys.has(item.key));

    state.resultsItems = [...state.resultsItems, ...newItems];
    state.resultsPageLoaded = nextResults.page;
      state.resultsHasMore = nextResults.page < nextResults.totalPages;
    }
}

async function applyHomepageGenre(genreName) {
  state.genre = genreName;
  state.featuredMovieOffset = 0;
  state.featuredSeriesOffset = 0;
  resetHomepageToTrendingContext({ clearInputs: true });
  closeHomePreview();
  renderStaticUi();

  state.homeServiceLoading = true;
  renderFeatured();

  try {
    await ensureHomeServiceCoverage();
  } finally {
    state.homeServiceLoading = false;
  }

  emphasizeFeaturedSection();
}

async function loadMoreResults() {
  if (state.resultsLoadingMore || !state.resultsHasMore || !hasToken()) {
    return;
  }

  state.resultsLoadingMore = true;
  renderResults();

  try {
    if (!state.query) {
      if (state.resultsMode === "genre" && state.resultsGenre) {
        const nextPage = state.resultsPageLoaded + 1;
        const { items, page, totalPages } = await fetchGenrePage(
          state.resultsGenre,
          nextPage,
          state.activeSearchContext.mediaType || "all"
        );
        const existingKeys = new Set(state.resultsItems.map((item) => item.key));
        const newItems = items.filter((item) => !existingKeys.has(item.key));

        state.resultsItems = [...state.resultsItems, ...newItems];
        state.resultsPageLoaded = page;
        state.resultsHasMore = page < totalPages;
      } else {
        const nextPage = state.trendingPageLoaded + 1;
        const { items, totalPages } = await fetchTrendingPage(nextPage);
        const existingResultKeys = new Set(state.resultsItems.map((item) => item.key));
        const newResultItems = items.filter((item) => !existingResultKeys.has(item.key));

        state.resultsItems = [...state.resultsItems, ...newResultItems];

        const existingFeaturedKeys = new Set(state.featuredItems.map((item) => item.key));
        const newFeaturedItems = items.filter((item) => !existingFeaturedKeys.has(item.key));
        state.featuredItems = [...state.featuredItems, ...newFeaturedItems];

        state.trendingPageLoaded = nextPage;
        state.trendingHasMore = state.trendingPageLoaded < totalPages;
        state.resultsPageLoaded = state.trendingPageLoaded;
        state.resultsHasMore = state.trendingHasMore;
      }
    } else {
      const nextPage = state.resultsPageLoaded + 1;
      let nextResults;

      if (state.resultsMode === "search-service" && state.activeSearchContext.serviceKey) {
        const service = HOME_SERVICE_BY_KEY.get(state.activeSearchContext.serviceKey);
        nextResults = service
          ? await fetchServiceSearchPage(service, nextPage, state.activeSearchContext.mediaType || "all")
          : { items: [], page: nextPage, totalPages: nextPage };
      } else if (state.resultsMode === "genre" && state.activeSearchContext.genreName) {
        nextResults = await fetchGenrePage(
          state.activeSearchContext.genreName,
          nextPage,
          state.activeSearchContext.mediaType || "all"
        );
      } else {
        nextResults = await fetchSearchPage(
          state.query,
          nextPage,
          state.activeSearchContext.mediaType || "all"
        );
      }

      const { items, page, totalPages } = nextResults;
      const existingKeys = new Set(state.resultsItems.map((item) => item.key));
      const newItems = items.filter((item) => !existingKeys.has(item.key));

      state.resultsItems = [...state.resultsItems, ...newItems];
      state.resultsPageLoaded = page;
      state.resultsHasMore = page < totalPages;
    }

    state.resultsAutoLoadCount += 1;
  } finally {
    state.resultsLoadingMore = false;
    renderResults();
  }
}

async function fetchDetail(key) {
  if (state.detailCache.has(key)) {
    return state.detailCache.get(key);
  }

  if (detailRequestCache.has(key)) {
    return detailRequestCache.get(key);
  }

  const request = (async () => {
    const { mediaType, id } = splitKey(key);
    const summary = state.itemCache.get(key);
    const detailPath = `/${mediaType}/${id}`;
    const creditsPath = mediaType === "tv" ? `${detailPath}/aggregate_credits` : `${detailPath}/credits`;
    const ratingsPath = mediaType === "tv" ? `${detailPath}/content_ratings` : `${detailPath}/release_dates`;

    const [detail, credits, providersData, recommendations, ratings, videos] = await Promise.all([
      tmdbFetch(detailPath, { language: TMDB.language }),
      tmdbFetch(creditsPath, { language: TMDB.language }),
      tmdbFetch(`${detailPath}/watch/providers`),
      tmdbFetch(`${detailPath}/recommendations`, { language: TMDB.language, page: 1 }),
      tmdbFetch(ratingsPath),
      tmdbFetch(`${detailPath}/videos`, { language: TMDB.language }),
    ]);

    const providers = normalizeProviders(providersData);
    const trailer = (videos.results || []).find(
      (video) =>
        video.site === "YouTube" &&
        (video.type === "Trailer" || video.type === "Teaser") &&
        (video.official || video.type === "Trailer")
    );
    const relatedItems = (recommendations.results || [])
      .filter((item) => (item.media_type || mediaType) === mediaType)
      .slice(0, 12)
      .map((item) => normalizeSummary({ ...item, media_type: mediaType }));

    await attachProviders(relatedItems, relatedItems.length);

    const recommendationReference = {
      mediaType,
      genre: detail.genres?.[0]?.name || summary?.genre || mediaLabel({ mediaType }),
      genreIds: detail.genres?.map((genre) => genre.id).filter(Boolean) || summary?.genreIds || [],
      releaseDateRaw: detail.release_date || detail.first_air_date || summary?.releaseDateRaw || "",
      providers,
    };
    const related = rankCuratedItems(
      relatedItems.filter((item) => item.isAvailable),
      {
        activeServiceKey: providerDiversityKey(recommendationReference),
        referenceItem: recommendationReference,
      }
    ).slice(0, 3);

    const normalized = {
      key,
      id: detail.id,
      mediaType,
      title: detail.title || detail.name || summary?.title || "Untitled",
      releaseDateRaw: releaseDateValue(detail),
      type: mediaType === "tv" ? "Series" : "Movie",
      year: (detail.release_date || detail.first_air_date || "").slice(0, 4) || summary?.year || "TBD",
      genre: detail.genres?.[0]?.name || summary?.genre || mediaLabel({ mediaType }),
      rating: detail.vote_average ? Number(detail.vote_average).toFixed(1) : summary?.rating || "NR",
      voteAverage: Number(detail.vote_average ?? summary?.voteAverage ?? 0),
      voteCount: Number(detail.vote_count ?? summary?.voteCount ?? 0),
      popularity: Number(detail.popularity ?? summary?.popularity ?? 0),
      genreIds: detail.genres?.map((genre) => genre.id).filter(Boolean) || summary?.genreIds || [],
      maturity: ratingForRegion(detail, ratings, mediaType),
      runtime: runtimeLabel(detail, mediaType),
      availability: availabilityLabel(detail, mediaType, providers),
      availabilityInfo: fallbackAvailability(detail, mediaType, providers),
      providers,
      trailer: trailer ? youTubeEmbedUrl(trailer.key) : "",
      trailerKey: trailer?.key || "",
      trailerThumbnail: trailer?.key ? `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg` : "",
      trailerLink:
        trailer && trailer.site === "YouTube"
          ? `https://www.youtube.com/watch?v=${trailer.key}`
          : "",
      image: imageUrl(detail.poster_path || detail.backdrop_path),
      backdrop: imageUrl(detail.backdrop_path || detail.poster_path, TMDB.backdropSize),
      overview: detail.overview || summary?.overview || "No synopsis is available yet.",
      tagline: detail.tagline || "",
      genres: detail.genres?.map((genre) => genre.name).filter(Boolean) || [],
      cast: normalizeCast(credits, mediaType),
      crew: normalizeCrew(credits),
      details: {
        director: mediaType === "movie"
          ? credits.crew?.find((person) => person.job === "Director")?.name || "Unknown"
          : detail.created_by?.map((person) => person.name).join(", ") || "Unknown",
        studio: detail.production_companies?.[0]?.name || detail.networks?.[0]?.name || "Unknown",
        release: detail.release_date || detail.first_air_date || "TBD",
        status: detail.status || "Unknown",
      },
      insights: buildDetailInsights(detail, mediaType),
      related,
    };

    normalized.isAvailable = hasSupportedAvailability(providers);

    setCached(state.detailCache, key, normalized, CACHE_LIMITS.detail);
    setCached(state.previewCache, key, normalized, CACHE_LIMITS.preview);
    setCached(state.itemCache, key, normalized, CACHE_LIMITS.item);
    void getRequestStatus(normalized.id, normalized.mediaType);
    return normalized;
  })();

  detailRequestCache.set(key, request);
  try {
    return await request;
  } finally {
    detailRequestCache.delete(key);
  }
}

async function fetchPreviewDetail(key) {
  if (state.detailCache.has(key)) {
    return state.detailCache.get(key);
  }

  if (state.previewCache.has(key)) {
    return state.previewCache.get(key);
  }

  if (previewRequestCache.has(key)) {
    return previewRequestCache.get(key);
  }

  const request = (async () => {
    const { mediaType, id } = splitKey(key);
    const summary = state.itemCache.get(key);
    const detailPath = `/${mediaType}/${id}`;
    const ratingsPath = mediaType === "tv" ? `${detailPath}/content_ratings` : `${detailPath}/release_dates`;

    const [detail, providersData, ratings, videos] = await Promise.all([
      tmdbFetch(detailPath, { language: TMDB.language }),
      tmdbFetch(`${detailPath}/watch/providers`),
      tmdbFetch(ratingsPath),
      tmdbFetch(`${detailPath}/videos`, { language: TMDB.language }),
    ]);

    const providers = normalizeProviders(providersData);
    const trailer = (videos.results || []).find(
      (video) =>
        video.site === "YouTube" &&
        (video.type === "Trailer" || video.type === "Teaser") &&
        (video.official || video.type === "Trailer")
    );

    const normalized = {
      key,
      id: detail.id,
      mediaType,
      title: detail.title || detail.name || summary?.title || "Untitled",
      releaseDateRaw: releaseDateValue(detail),
      type: mediaType === "tv" ? "Series" : "Movie",
      year: (detail.release_date || detail.first_air_date || "").slice(0, 4) || summary?.year || "TBD",
      genre: detail.genres?.[0]?.name || summary?.genre || mediaLabel({ mediaType }),
      rating: detail.vote_average ? Number(detail.vote_average).toFixed(1) : summary?.rating || "NR",
      voteAverage: Number(detail.vote_average ?? summary?.voteAverage ?? 0),
      voteCount: Number(detail.vote_count ?? summary?.voteCount ?? 0),
      popularity: Number(detail.popularity ?? summary?.popularity ?? 0),
      genreIds: detail.genres?.map((genre) => genre.id).filter(Boolean) || summary?.genreIds || [],
      maturity: ratingForRegion(detail, ratings, mediaType),
      runtime: runtimeLabel(detail, mediaType),
      availability: availabilityLabel(detail, mediaType, providers),
      availabilityInfo: fallbackAvailability(detail, mediaType, providers),
      providers,
      trailer: trailer ? youTubeEmbedUrl(trailer.key) : "",
      trailerKey: trailer?.key || "",
      trailerThumbnail: trailer?.key ? `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg` : "",
      trailerLink:
        trailer && trailer.site === "YouTube"
          ? `https://www.youtube.com/watch?v=${trailer.key}`
          : "",
      image: imageUrl(detail.poster_path || detail.backdrop_path),
      backdrop: imageUrl(detail.backdrop_path || detail.poster_path, TMDB.backdropSize),
      overview: detail.overview || summary?.overview || "No synopsis is available yet.",
      tagline: detail.tagline || "",
      genres: detail.genres?.map((genre) => genre.name).filter(Boolean) || [],
      cast: [],
      crew: [],
      details: {
        director: mediaType === "tv"
          ? detail.created_by?.map((person) => person.name).join(", ") || "Unknown"
          : summary?.details?.director || "Open details for full cast and crew",
        studio: detail.production_companies?.[0]?.name || detail.networks?.[0]?.name || "Unknown",
        release: detail.release_date || detail.first_air_date || "TBD",
        status: detail.status || "Unknown",
      },
      insights: [],
      related: [],
    };

    normalized.isAvailable = hasSupportedAvailability(providers);

    setCached(state.previewCache, key, normalized, CACHE_LIMITS.preview);
    setCached(state.itemCache, key, normalized, CACHE_LIMITS.item);
    void getRequestStatus(normalized.id, normalized.mediaType);
    return normalized;
  })();

  previewRequestCache.set(key, request);
  try {
    return await request;
  } finally {
    previewRequestCache.delete(key);
  }
}

async function fetchSummaryByKey(key) {
  if (state.itemCache.has(key)) {
    return state.itemCache.get(key);
  }

  const { mediaType, id } = splitKey(key);
  const detail = await tmdbFetch(`/${mediaType}/${id}`, { language: TMDB.language });
  const summary = normalizeSummary({ ...detail, media_type: mediaType });
  const providersData = await tmdbFetch(`/${mediaType}/${id}/watch/providers`);
  const providers = normalizeProviders(providersData);
  summary.providers = providers;
  summary.isAvailable = hasSupportedAvailability(providers);
  summary.availability = providers.some((provider) => provider.accessType === "stream" || provider.accessType === "ad-supported")
    ? "Streaming availability found"
    : providers.some((provider) => provider.accessType === "buy" || provider.accessType === "rent")
      ? "Buy or rent available"
      : "Unavailable";
  setCached(state.itemCache, summary.key, summary, CACHE_LIMITS.item);
  return summary;
}

function setLoading(container, message) {
  container.innerHTML = `<div class="loading-card">${escapeHtml(message)}</div>`;
}

function updateHomeCardSelection() {
  document.querySelectorAll(".media-card").forEach((card) => {
    card.classList.toggle("is-active", card.dataset.openDetails === state.homePreviewKey);
  });
}

function animateShelf(container, direction = "forward") {
  if (!container || prefersReducedMotion.matches) {
    return;
  }

  const existingTimer = shelfAnimationTimers.get(container);
  if (existingTimer) {
    window.clearTimeout(existingTimer);
  }

  container.classList.remove("is-animating", "is-animating-forward", "is-animating-backward");
  void container.offsetWidth;
  container.classList.add("is-animating", direction === "backward" ? "is-animating-backward" : "is-animating-forward");

  const timer = window.setTimeout(() => {
    container.classList.remove("is-animating", "is-animating-forward", "is-animating-backward");
    shelfAnimationTimers.delete(container);
  }, 520);

  shelfAnimationTimers.set(container, timer);
}

function resetResultsPaging() {
  state.resultsMode = "trending";
  state.resultsGenre = "";
  state.resultsPageLoaded = 0;
  state.resultsHasMore = true;
  state.resultsLoadingMore = false;
  state.resultsAutoLoadCount = 0;
}

function renderChipSet(container, items, activeValue, key) {
  container.innerHTML = items
    .map(
      (item) => `
        <button class="chip ${item === activeValue ? "active" : ""}" type="button" data-${key}="${escapeHtml(item)}"${item === activeValue ? ' aria-current="true"' : ""}>
          ${escapeHtml(item)}
        </button>
      `
    )
    .join("");
}

function genreLabelsForHomepage(name, mediaType) {
  const equivalents = HOME_GENRE_EQUIVALENTS[name];
  if (equivalents?.[mediaType]?.length) {
    return equivalents[mediaType];
  }

  return name ? [name] : [];
}

function genreIdSetForHomepage(name, mediaType) {
  if (!name || name === "Trending") {
    return null;
  }

  const lookup = mediaType === "tv" ? state.genres.tv : state.genres.movie;
  const ids = genreLabelsForHomepage(name, mediaType)
    .map((label) => [...lookup.entries()].find(([, entryLabel]) => entryLabel === label)?.[0] || null)
    .filter(Boolean);

  return ids.length ? new Set(ids) : null;
}

function availableGenres() {
  const names = new Set(["Trending"]);
  [...state.featuredItems, ...state.resultsItems].forEach((item) => {
    if (item.genre) {
      names.add(item.genre);
    }
  });
  return [...names];
}

function genreIdsForName(name) {
  if (!name || name === "Trending") {
    return { movie: null, tv: null };
  }

  const movie = [...state.genres.movie.entries()].find(([, label]) => label === name)?.[0] || null;
  const tv = [...state.genres.tv.entries()].find(([, label]) => label === name)?.[0] || null;
  return { movie, tv };
}

function resolveGenreQuery(query, mediaType = "all") {
  const normalizedQuery = normalizeServiceName(query);
  if (!normalizedQuery) {
    return null;
  }

  const candidates = new Map();
  const addCandidate = (label, type) => {
    if (!label) {
      return;
    }

    const key = normalizeServiceName(label);
    const entry = candidates.get(key) || { label, movie: false, tv: false };
    entry[type] = true;
    candidates.set(key, entry);
  };

  if (mediaType !== "tv") {
    [...state.genres.movie.values()].forEach((label) => addCandidate(label, "movie"));
  }

  if (mediaType !== "movie") {
    [...state.genres.tv.values()].forEach((label) => addCandidate(label, "tv"));
  }

  return [...candidates.values()].find((entry) => normalizeServiceName(entry.label) === normalizedQuery) || null;
}

function resolveServiceQuery(query) {
  const normalizedQuery = normalizeServiceName(query);
  if (!normalizedQuery) {
    return null;
  }

  const exactKey = HOME_SERVICE_ALIAS_INDEX.get(normalizedQuery);
  if (exactKey) {
    const exactService = HOME_SERVICE_BY_KEY.get(exactKey) || null;
    if (exactService?.providerId) {
      return exactService;
    }
  }
  return null;
}

async function fetchTitleSearchPage(query, page, mediaType = "all") {
  if (mediaType === "movie" || mediaType === "tv") {
    const path = mediaType === "movie" ? "/search/movie" : "/search/tv";
    const data = await tmdbFetch(path, {
      query,
      language: TMDB.language,
      include_adult: "false",
      page,
    });

    const items = (data.results || []).map((item) => normalizeSummary({ ...item, media_type: mediaType }));
    await attachProviders(items, items.length);

    return {
      items: items.filter((item) => item.isAvailable),
      page: data.page || page,
      totalPages: data.total_pages || page,
    };
  }

  const data = await tmdbFetch("/search/multi", {
    query,
    language: TMDB.language,
    include_adult: "false",
    page,
  });

  const items = (data.results || [])
    .filter((item) => item.media_type === "movie" || item.media_type === "tv")
    .map(normalizeSummary);

  await attachProviders(items, items.length);

  return {
    items: items.filter((item) => item.isAvailable),
    page: data.page || page,
    totalPages: data.total_pages || page,
  };
}

async function fetchGenreSearchPage(genreName, page, mediaType = "all") {
  const ids = genreIdsForName(genreName);
  const requests = [];

  if (ids.movie && mediaType !== "tv") {
    requests.push(
      tmdbFetch("/discover/movie", {
        language: TMDB.language,
        region: TMDB.region,
        sort_by: "popularity.desc",
        with_genres: ids.movie,
        include_adult: "false",
        page,
      }).then((data) => ({
        page: data.page || page,
        totalPages: data.total_pages || page,
        items: (data.results || []).map((item) => normalizeSummary({ ...item, media_type: "movie" })),
      }))
    );
  }

  if (ids.tv && mediaType !== "movie") {
    requests.push(
      tmdbFetch("/discover/tv", {
        language: TMDB.language,
        watch_region: TMDB.region,
        sort_by: "popularity.desc",
        with_genres: ids.tv,
        include_adult: "false",
        page,
      }).then((data) => ({
        page: data.page || page,
        totalPages: data.total_pages || page,
        items: (data.results || []).map((item) => normalizeSummary({ ...item, media_type: "tv" })),
      }))
    );
  }

  const responses = await Promise.all(requests);
  const items = responses.flatMap((response) => response.items);
  await attachProviders(items, items.length);

  return {
    items: items.filter((item) => item.isAvailable),
    page: responses.length ? Math.max(...responses.map((response) => response.page)) : page,
    totalPages: responses.length ? Math.max(...responses.map((response) => response.totalPages)) : page,
  };
}

async function fetchServiceSearchPage(service, page, mediaType = "all") {
  const requests = [];

  if (mediaType !== "tv") {
    requests.push(fetchHomeServiceSupplementPage(service, "Movie", page));
  }

  if (mediaType !== "movie") {
    requests.push(fetchHomeServiceSupplementPage(service, "Series", page));
  }

  const responses = await Promise.all(requests);

  return {
    items: responses.flatMap((response) => response.items),
    page,
    totalPages: responses.length ? Math.max(...responses.map((response) => response.totalPages)) : page,
  };
}

function filteredResults() {
  const items = state.resultsItems.filter((item) => {
    const matchesGenre = state.genre === "Trending" ? true : item.genre === state.genre;
    const matchesType =
      state.resultsType === "All Results" ||
      (state.resultsType === "Movies" && item.type === "Movie") ||
      (state.resultsType === "Series" && item.type === "Series");

    return matchesGenre && matchesType;
  });

  return state.resultsMode === "search-title"
    ? items
    : sortByRecommendationScore(items);
}

function homeServiceWindow() {
  if (window.innerWidth >= 1480) {
    return 7;
  }

  if (window.innerWidth >= 1180) {
    return 6;
  }

  if (window.innerWidth >= 860) {
    return 4;
  }

  return 3;
}

function homeFeaturedWindow() {
  const minCardWidth = 215;
  const gridGap = 19.2; // 1.2rem, matched to .results-grid
  const availableWidth = Math.max(
    Number(featuredMoviesGrid?.clientWidth || 0),
    Number(featuredSeriesGrid?.clientWidth || 0),
    Number(window.innerWidth || 0) - 32
  );
  const derivedColumns = Math.floor((availableWidth + gridGap) / (minCardWidth + gridGap));
  return Math.max(2, Math.min(5, derivedColumns || 2));
}

function homeFeaturedReadyCount() {
  return homeFeaturedWindow() * HOME_FEATURED_READY_WINDOWS;
}

function compareHomeServices(left, right) {
  const leftRank = HOME_SERVICE_POPULARITY_INDEX.get(left.key);
  const rightRank = HOME_SERVICE_POPULARITY_INDEX.get(right.key);

  if (leftRank !== undefined && rightRank !== undefined && leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  if (leftRank !== undefined && rightRank === undefined) {
    return -1;
  }

  if (leftRank === undefined && rightRank !== undefined) {
    return 1;
  }

  return (
    (right.streamCount || 0) - (left.streamCount || 0) ||
    (right.supplementCount || 0) - (left.supplementCount || 0) ||
    (right.count || 0) - (left.count || 0) ||
    left.name.localeCompare(right.name)
  );
}

function availableHomeServices() {
  const services = new Map();

  state.featuredItems.forEach((item) => {
    item.providers.forEach((provider) => {
      const key = serviceKeyFor(provider.name);
      const label = serviceNameForKey(key, compactProviderLabel(provider.name) || provider.name);
      const existing = services.get(key) || {
        key,
        name: label,
        count: 0,
        streamCount: 0,
        logoPath: "",
      };

      existing.count += 1;

      if (provider.accessType === "stream" || provider.accessType === "ad-supported") {
        existing.streamCount += 1;
      }

      const logoPriority =
        provider.accessType === "stream" || provider.accessType === "ad-supported"
          ? 2
          : 1;

      if (provider.logoPath && (!existing.logoPath || logoPriority >= (existing.logoPriority || 0))) {
        existing.logoPath = provider.logoPath;
        existing.logoUrl = imageUrl(provider.logoPath, "w500");
        existing.logoPriority = logoPriority;
      }

      if (provider.providerId && (!existing.providerId || logoPriority >= (existing.providerPriority || 0))) {
        existing.providerId = provider.providerId;
        existing.providerPriority = logoPriority;
      }

      services.set(key, existing);
    });
  });

  const catalogServices = HOME_SERVICE_CATALOG.map((service) => {
    const serviceData = services.get(service.key);
    const supplementEntry = state.homeServiceSupplementCache.get(service.key);
    const supplementCount = (supplementEntry?.items.Movie.length || 0) + (supplementEntry?.items.Series.length || 0);
    return {
      key: service.key,
      name: service.name,
      count: serviceData?.count || 0,
      streamCount: serviceData?.streamCount || 0,
      logoPath: serviceData?.logoPath || "",
      logoUrl: serviceData?.logoUrl || "",
      providerId: service.providerId || serviceData?.providerId || null,
      supplementCount,
    };
  });

  const visibleCatalogServices = catalogServices.filter((service) => (
    service.key === "all" ||
    Boolean(service.providerId) ||
    service.streamCount > 0 ||
    service.supplementCount > 0
  ));

  const allServicesEntry = visibleCatalogServices.find((service) => service.key === "all") || null;
  const sortedServices = visibleCatalogServices
    .filter((service) => service.key !== "all")
    .sort(compareHomeServices);

  return allServicesEntry ? [allServicesEntry, ...sortedServices] : sortedServices;
}

function genericServiceLogo(label) {
  const safeLabel = escapeSvgText(label);
  const fontSize = label.length >= 16 ? 24 : label.length >= 11 ? 28 : 34;
  return svgData(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="${safeLabel}">
      <text x="160" y="52" fill="#f7f9ff" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="-1" text-anchor="middle" dominant-baseline="middle">${safeLabel}</text>
    </svg>
  `);
}

function serviceLogoData(name) {
  const key = serviceKeyFor(name);

  switch (key) {
    case "all":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="All Services">
          <text x="160" y="52" fill="#f7f9ff" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" letter-spacing="5" text-anchor="middle" dominant-baseline="middle">ALL</text>
        </svg>
      `);
    case "netflix":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="Netflix">
          <text x="160" y="52" fill="#f7f9ff" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="40" font-weight="900" letter-spacing="-1.5" text-anchor="middle" dominant-baseline="middle">NETFLIX</text>
        </svg>
      `);
    case "disneyplus":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="Disney Plus">
          <path d="M72 28 C118 8, 196 8, 248 24" fill="none" stroke="#f7f9ff" stroke-width="4" stroke-linecap="round"/>
          <text x="160" y="54" fill="#f7f9ff" font-family="Georgia, Times New Roman, serif" font-size="34" font-style="italic" font-weight="700" text-anchor="middle" dominant-baseline="middle">Disney+</text>
        </svg>
      `);
    case "primevideo":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="Prime Video">
          <text x="160" y="40" fill="#f7f9ff" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800" letter-spacing="-1" text-anchor="middle">prime video</text>
          <path d="M102 58 C134 76, 198 76, 226 56" fill="none" stroke="#f7f9ff" stroke-width="5" stroke-linecap="round"/>
          <path d="M216 53 L230 56 L220 66" fill="none" stroke="#f7f9ff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `);
    case "appletv":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="Apple TV Plus">
          <g fill="#f7f9ff" transform="translate(62 23)">
            <path d="M22 10c4-5 3-10 2-10-4 0-8 3-10 7-2 4-1 8-1 8s5 1 9-5z"/>
            <path d="M33 25c-3-4-7-5-9-5-5 0-8 3-10 3-2 0-5-3-9-3-7 0-13 6-13 15 0 5 2 11 5 15 3 5 6 10 11 10 4 0 5-3 10-3 5 0 6 3 10 3 5 0 8-4 11-9 2-4 3-7 3-7s-6-2-6-10c0-6 5-9 6-10-4-5-9-5-9-5z"/>
          </g>
          <text x="198" y="52" fill="#f7f9ff" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="800" letter-spacing="-2" text-anchor="middle" dominant-baseline="middle">tv+</text>
        </svg>
      `);
    case "hulu":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="Hulu">
          <text x="160" y="52" fill="#f7f9ff" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="900" letter-spacing="-2" text-anchor="middle" dominant-baseline="middle">hulu</text>
        </svg>
      `);
    case "hbo":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="HBO">
          <text x="160" y="52" fill="#f7f9ff" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="56" font-weight="900" letter-spacing="-3" text-anchor="middle" dominant-baseline="middle">HBO</text>
        </svg>
      `);
    case "discoveryplus":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="discovery plus">
          <g transform="translate(26 18)">
            <circle cx="28" cy="30" r="15" fill="none" stroke="#f7f9ff" stroke-width="4"/>
            <path d="M14 28 C18 14, 36 12, 43 24" fill="none" stroke="#f7f9ff" stroke-width="3.5" stroke-linecap="round"/>
          </g>
          <text x="198" y="52" fill="#f7f9ff" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" letter-spacing="-1" text-anchor="middle" dominant-baseline="middle">discovery+</text>
        </svg>
      `);
    case "abc":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="ABC">
          <circle cx="160" cy="48" r="31" fill="#f7f9ff"/>
          <text x="160" y="52" fill="#1e2a42" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="800" letter-spacing="-2.4" text-anchor="middle" dominant-baseline="middle">abc</text>
        </svg>
      `);
    case "fox":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="FOX">
          <text x="160" y="52" fill="#f7f9ff" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="66" font-weight="900" letter-spacing="-5" text-anchor="middle" dominant-baseline="middle">FOX</text>
        </svg>
      `);
    case "cinemax":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="Cinemax">
          <g transform="translate(28 12)">
            <polygon points="30,54 208,38 216,12 38,28" fill="#f7f9ff"/>
            <text x="125" y="37" fill="#1e2a42" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="29" font-style="italic" font-weight="900" letter-spacing="-1.2" text-anchor="middle" dominant-baseline="middle">CINEMAX</text>
          </g>
        </svg>
      `);
    case "amc":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="AMC">
          <rect x="94" y="18" width="132" height="60" fill="none" stroke="#f7f9ff" stroke-width="5"/>
          <text x="160" y="52" fill="#f7f9ff" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="38" font-weight="900" letter-spacing="-1" text-anchor="middle" dominant-baseline="middle">amc</text>
        </svg>
      `);
    case "showtime":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="Showtime">
          <circle cx="98" cy="48" r="25" fill="none" stroke="#f7f9ff" stroke-width="5"/>
          <text x="98" y="50" fill="#f7f9ff" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="23" font-weight="900" letter-spacing="-1" text-anchor="middle" dominant-baseline="middle">SHO</text>
          <text x="196" y="50" fill="#f7f9ff" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="30" font-weight="900" letter-spacing="-1.3" text-anchor="middle" dominant-baseline="middle">WTIME</text>
        </svg>
      `);
    case "starz":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="STARZ">
          <text x="160" y="52" fill="#f7f9ff" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="54" font-weight="900" letter-spacing="-2.2" text-anchor="middle" dominant-baseline="middle">STARZ</text>
        </svg>
      `);
    case "cw":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="The CW">
          <text x="112" y="49" fill="#f7f9ff" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="middle">THE</text>
          <text x="188" y="50" fill="#f7f9ff" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="52" font-weight="900" letter-spacing="-3" text-anchor="middle" dominant-baseline="middle">CW</text>
        </svg>
      `);
    case "nbc":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="NBC">
          <g fill="#f7f9ff" transform="translate(48 28)">
            <circle cx="16" cy="18" r="10"/><circle cx="30" cy="14" r="10"/><circle cx="44" cy="18" r="10"/><circle cx="24" cy="30" r="10"/><circle cx="36" cy="30" r="10"/><rect x="24" y="18" width="8" height="22" rx="4"/>
          </g>
          <text x="192" y="52" fill="#f7f9ff" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="46" font-weight="900" letter-spacing="-2" text-anchor="middle" dominant-baseline="middle">NBC</text>
        </svg>
      `);
    case "cbs":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="CBS">
          <ellipse cx="86" cy="48" rx="27" ry="18" fill="none" stroke="#f7f9ff" stroke-width="5"/>
          <circle cx="86" cy="48" r="8" fill="#f7f9ff"/>
          <text x="188" y="52" fill="#f7f9ff" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="48" font-weight="900" letter-spacing="-2" text-anchor="middle" dominant-baseline="middle">CBS</text>
        </svg>
      `);
    case "paramountplus":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="Paramount Plus">
          <path d="M88 30 C126 18, 196 18, 232 30" fill="none" stroke="#f7f9ff" stroke-width="3.5" stroke-linecap="round"/>
          <text x="160" y="54" fill="#f7f9ff" font-family="Georgia, Times New Roman, serif" font-size="36" font-style="italic" font-weight="700" text-anchor="middle" dominant-baseline="middle">Paramount+</text>
        </svg>
      `);
    case "bbcone":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="BBC One">
          <rect x="62" y="30" width="28" height="20" fill="none" stroke="#f7f9ff" stroke-width="3"/><rect x="94" y="30" width="28" height="20" fill="none" stroke="#f7f9ff" stroke-width="3"/><rect x="126" y="30" width="28" height="20" fill="none" stroke="#f7f9ff" stroke-width="3"/>
          <text x="76" y="44" fill="#f7f9ff" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" text-anchor="middle" dominant-baseline="middle">B</text>
          <text x="108" y="44" fill="#f7f9ff" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" text-anchor="middle" dominant-baseline="middle">B</text>
          <text x="140" y="44" fill="#f7f9ff" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" text-anchor="middle" dominant-baseline="middle">C</text>
          <text x="218" y="50" fill="#f7f9ff" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="44" font-weight="900" letter-spacing="-2" text-anchor="middle" dominant-baseline="middle">one</text>
        </svg>
      `);
    case "cartoonnetwork":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="Cartoon Network">
          <text x="160" y="42" fill="#f7f9ff" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="54" font-weight="900" letter-spacing="-4" text-anchor="middle" dominant-baseline="middle">CN</text>
          <text x="160" y="68" fill="#f7f9ff" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" letter-spacing="1" text-anchor="middle" dominant-baseline="middle">CARTOON NETWORK</text>
        </svg>
      `);
    case "adultswim":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="Adult Swim">
          <text x="160" y="52" fill="#f7f9ff" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="60" font-weight="900" letter-spacing="-2" text-anchor="middle" dominant-baseline="middle">[as]</text>
        </svg>
      `);
    case "nick":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="Nick">
          <text x="160" y="52" fill="#f7f9ff" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="58" font-weight="900" letter-spacing="-3" text-anchor="middle" dominant-baseline="middle">nick</text>
        </svg>
      `);
    case "peacock":
      return svgData(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" role="img" aria-label="Peacock">
          <text x="136" y="52" fill="#f7f9ff" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" letter-spacing="-1.2" text-anchor="middle" dominant-baseline="middle">peacock</text>
          <g fill="#f7f9ff" transform="translate(248 28)">
            <circle cx="0" cy="0" r="4.2"/><circle cx="10" cy="0" r="4.2"/><circle cx="20" cy="0" r="4.2"/><circle cx="0" cy="12" r="4.2"/><circle cx="10" cy="12" r="4.2"/><circle cx="20" cy="12" r="4.2"/>
          </g>
        </svg>
      `);
    default:
      return genericServiceLogo(serviceNameForKey(key, name));
  }
}

function serviceShelfLogo(service) {
  const tmdbLogoPath = TMDB_SERVICE_LOGO_PATHS[service.key] || service.logoPath || "";
  if (tmdbLogoPath) {
    return {
      src: tmdbLogoImageUrl(tmdbLogoPath),
      className: "is-tmdb",
    };
  }

  if (service.logoUrl) {
    return {
      src: service.logoUrl,
      className: "is-tmdb",
    };
  }

  return {
    src: serviceLogoData(service.name),
    className: "is-generated",
  };
}

function activeHomeServiceMeta() {
  const activeKey = serviceKeyFor(state.homeServiceFilter);
  return availableHomeServices().find((service) => service.key === activeKey) || null;
}

function homeServiceSupplementEntry(serviceKey) {
  if (!state.homeServiceSupplementCache.has(serviceKey)) {
    state.homeServiceSupplementCache.set(serviceKey, {
      pages: { Movie: 0, Series: 0 },
      hasMore: { Movie: true, Series: true },
      items: { Movie: [], Series: [] },
      providerId: null,
    });
  }

  return state.homeServiceSupplementCache.get(serviceKey);
}

function homeGenreSupplementKey(serviceKey, genreName) {
  return `${serviceKey}::${normalizeServiceName(genreName) || "trending"}`;
}

function homeGenreSupplementEntry(serviceKey, genreName) {
  const key = homeGenreSupplementKey(serviceKey, genreName);
  if (!state.homeGenreSupplementCache.has(key)) {
    state.homeGenreSupplementCache.set(key, {
      pages: { Movie: 0, Series: 0 },
      hasMore: { Movie: true, Series: true },
      items: { Movie: [], Series: [] },
      providerId: null,
      genreName,
    });
  }

  return state.homeGenreSupplementCache.get(key);
}

async function fetchHomeServiceSupplementPage(service, type, page) {
  const isMovie = type === "Movie";
  const mediaType = isMovie ? "movie" : "tv";
  const path = isMovie ? "/discover/movie" : "/discover/tv";
  const data = await tmdbFetch(path, {
    language: TMDB.language,
    watch_region: TMDB.region,
    with_watch_providers: String(service.providerId),
    with_watch_monetization_types: "flatrate|free|ads",
    sort_by: "popularity.desc",
    include_adult: "false",
    page,
  });

  const items = (data.results || [])
    .map((item) => normalizeSummary({ ...item, media_type: mediaType }));

  await attachProviders(items, items.length);

  return {
    items: items.filter(
      (item) =>
        item.isAvailable &&
        item.providers.some((provider) => serviceKeyFor(provider.name) === service.key)
    ),
    totalPages: data.total_pages || page,
  };
}

async function fetchHomepageGenreSupplementPage(service, genreName, type, page) {
  const isMovie = type === "Movie";
  const mediaType = isMovie ? "movie" : "tv";
  const path = isMovie ? "/discover/movie" : "/discover/tv";
  const genreIds = genreIdSetForHomepage(genreName, mediaType);

  if (!genreIds?.size) {
    return {
      items: [],
      totalPages: page,
    };
  }

  const params = {
    language: TMDB.language,
    region: TMDB.region,
    sort_by: "popularity.desc",
    include_adult: "false",
    with_genres: [...genreIds].join("|"),
    page,
  };

  if (service?.providerId) {
    params.watch_region = TMDB.region;
    params.with_watch_providers = String(service.providerId);
    params.with_watch_monetization_types = "flatrate|free|ads";
  }

  const data = await tmdbFetch(path, params);
  const items = (data.results || []).map((item) => normalizeSummary({ ...item, media_type: mediaType }));

  await attachProviders(items, items.length);

  return {
    items: items.filter((item) => {
      if (!item.isAvailable || !matchesActiveFeaturedGenre(item)) {
        return false;
      }

      if (!service || service.key === "all") {
        return true;
      }

      return item.providers.some((provider) => serviceKeyFor(provider.name) === service.key);
    }),
    totalPages: data.total_pages || page,
  };
}

async function loadHomeServiceSupplement(
  service,
  type,
  requiredCount,
  pageBudget = HOME_SERVICE_SUPPLEMENT_PAGE_BUDGET
) {
  if (!service?.providerId) {
    return;
  }

  const entry = homeServiceSupplementEntry(service.key);
  entry.providerId = service.providerId;
  let pagesFetched = 0;

  while (featuredByTypeForService(type, service.key).length < requiredCount && entry.hasMore[type] && pagesFetched < pageBudget) {
    const nextPage = entry.pages[type] + 1;
    const { items, totalPages } = await fetchHomeServiceSupplementPage(service, type, nextPage);
    const existingKeys = new Set([
      ...state.featuredItems.map((item) => item.key),
      ...entry.items.Movie.map((item) => item.key),
      ...entry.items.Series.map((item) => item.key),
    ]);
    const newItems = items.filter((item) => !existingKeys.has(item.key));

    entry.items[type] = [...entry.items[type], ...newItems];
    entry.pages[type] = nextPage;
    entry.hasMore[type] = nextPage < totalPages;
    pagesFetched += 1;

    if (!newItems.length && !entry.hasMore[type]) {
      break;
    }
  }
}

async function loadHomepageGenreSupplement(
  service,
  genreName,
  type,
  requiredCount,
  pageBudget = HOME_GENRE_SUPPLEMENT_PAGE_BUDGET
) {
  if (!genreName || genreName === "Trending") {
    return;
  }

  const serviceKey = service?.key || "all";
  const entry = homeGenreSupplementEntry(serviceKey, genreName);
  entry.providerId = service?.providerId || null;
  let pagesFetched = 0;

  while (
    featuredByTypeForService(type, serviceKey).length < requiredCount &&
    entry.hasMore[type] &&
    pagesFetched < pageBudget
  ) {
    const nextPage = entry.pages[type] + 1;
    const { items, totalPages } = await fetchHomepageGenreSupplementPage(service, genreName, type, nextPage);
    const existingKeys = new Set([
      ...state.featuredItems.map((item) => item.key),
      ...entry.items.Movie.map((item) => item.key),
      ...entry.items.Series.map((item) => item.key),
    ]);
    const newItems = items.filter((item) => !existingKeys.has(item.key));

    entry.items[type] = [...entry.items[type], ...newItems];
    entry.pages[type] = nextPage;
    entry.hasMore[type] = nextPage < totalPages;
    pagesFetched += 1;

    if (!newItems.length && !entry.hasMore[type]) {
      break;
    }
  }
}

function matchesHomeServiceKey(item, serviceKey) {
  if (serviceKey === "all") {
    return true;
  }

  return item.providers.some((provider) => serviceKeyFor(provider.name) === serviceKey);
}

function matchesHomeService(item) {
  return matchesHomeServiceKey(item, serviceKeyFor(state.homeServiceFilter));
}

function matchesActiveFeaturedGenre(item) {
  if (state.genre === "Trending") {
    return true;
  }

  const genreIds = genreIdSetForHomepage(state.genre, item.mediaType);
  if (genreIds?.size) {
    return item.genreIds?.some((genreId) => genreIds.has(genreId)) || false;
  }

  return item.genre === state.genre;
}

function featuredByTypeForService(type, serviceKey = serviceKeyFor(state.homeServiceFilter)) {
  const baseItems = state.featuredItems.filter(
    (item) => item.type === type && matchesHomeServiceKey(item, serviceKey) && matchesActiveFeaturedGenre(item)
  );
  const supplementSources = [];

  if (state.genre !== "Trending") {
    supplementSources.push(homeGenreSupplementEntry(serviceKey, state.genre).items[type] || []);
  } else if (serviceKey !== "all") {
    supplementSources.push((homeServiceSupplementEntry(serviceKey).items[type] || []).filter(matchesActiveFeaturedGenre));
  }

  const supplement = supplementSources.flat().filter(matchesActiveFeaturedGenre);
  if (!supplement.length) {
    return baseItems;
  }

  const seen = new Set();

  return [...baseItems, ...supplement].filter((item) => {
    if (seen.has(item.key)) {
      return false;
    }

    seen.add(item.key);
    return true;
  });
}

function featuredByType(type) {
  return featuredByTypeForService(type, serviceKeyFor(state.homeServiceFilter));
}

async function ensureHomeServiceCoverage({ focusType = "" } = {}) {
  const serviceKey = serviceKeyFor(state.homeServiceFilter);
  const featuredWindow = homeFeaturedWindow();
  const initialReadyCount = homeFeaturedReadyCount();
  const requiredMovieCount = Math.max(state.featuredMovieOffset + featuredWindow, initialReadyCount);
  const requiredSeriesCount = Math.max(state.featuredSeriesOffset + featuredWindow, initialReadyCount);

  if (state.genre !== "Trending") {
    const service = serviceKey === "all"
      ? { key: "all", name: "All Services", providerId: null }
      : activeHomeServiceMeta();

    const fillGenreCountForType = async (type, requiredCount) => {
      if (featuredByType(type).length < requiredCount) {
        await loadHomepageGenreSupplement(service, state.genre, type, requiredCount);
      }
    };

    if (focusType === "Movie") {
      await fillGenreCountForType("Movie", requiredMovieCount);
      return;
    }

    if (focusType === "Series") {
      await fillGenreCountForType("Series", requiredSeriesCount);
      return;
    }

    await fillGenreCountForType("Movie", requiredMovieCount);
    await fillGenreCountForType("Series", requiredSeriesCount);
    return;
  }

  if (serviceKey === "all") {
    if (featuredByType("Movie").length < requiredMovieCount) {
      await loadMoreTrendingIfNeeded("Movie", requiredMovieCount);
    }

    if (featuredByType("Series").length < requiredSeriesCount) {
      await loadMoreTrendingIfNeeded("Series", requiredSeriesCount);
    }

    return;
  }

  const service = activeHomeServiceMeta();
  let pagesChecked = 0;

  while (pagesChecked < HOME_TRENDING_COVERAGE_PAGE_BUDGET && state.trendingHasMore) {
    const movieCount = featuredByType("Movie").length;
    const seriesCount = featuredByType("Series").length;
    const needsMovieCoverage = focusType === "Movie"
      ? movieCount < requiredMovieCount
      : movieCount > 0 && movieCount < requiredMovieCount;
    const needsSeriesCoverage = focusType === "Series"
      ? seriesCount < requiredSeriesCount
      : seriesCount > 0 && seriesCount < requiredSeriesCount;
    const needsInitialRow = movieCount < featuredWindow && seriesCount < featuredWindow;

    if (!needsMovieCoverage && !needsSeriesCoverage && !needsInitialRow) {
      break;
    }

    const loadedPage = await loadNextTrendingPage();
    if (!loadedPage) {
      break;
    }

    pagesChecked += 1;
  }

  if (!service?.providerId) {
    return;
  }

  const fillCountForType = async (type, requiredCount) => {
    if (featuredByType(type).length < requiredCount) {
      await loadHomeServiceSupplement(service, type, requiredCount);
    }
  };

  if (focusType === "Movie") {
    await fillCountForType("Movie", requiredMovieCount);
    return;
  }

  if (focusType === "Series") {
    await fillCountForType("Series", requiredSeriesCount);
    return;
  }

  if (featuredByType("Movie").length < featuredWindow && featuredByType("Series").length < featuredWindow) {
    const preferredType = featuredByType("Movie").length >= featuredByType("Series").length ? "Movie" : "Series";
    const alternateType = preferredType === "Movie" ? "Series" : "Movie";
    await fillCountForType(preferredType, featuredWindow);

    if (featuredByType("Movie").length < featuredWindow && featuredByType("Series").length < featuredWindow) {
      await fillCountForType(alternateType, featuredWindow);
    }
  }

  await fillCountForType("Movie", requiredMovieCount);
  await fillCountForType("Series", requiredSeriesCount);
}

async function preloadHomepageServiceCoverage() {
  if (state.homeServicePreloading || !hasToken()) {
    return;
  }

  state.homeServicePreloading = true;
  const targetCount = homeFeaturedReadyCount();

  try {
    let trendingPagesLoaded = 0;

    while (trendingPagesLoaded < HOME_BACKGROUND_PRELOAD_TRENDING_PAGES && state.trendingHasMore) {
      const servicesToEvaluate = availableHomeServices().filter((service) => service.key !== "all");
      const needsMoreTrendingCoverage = servicesToEvaluate.some((service) => (
        featuredByTypeForService("Movie", service.key).length < targetCount ||
        featuredByTypeForService("Series", service.key).length < targetCount
      ));

      if (!needsMoreTrendingCoverage) {
        break;
      }

      const loadedPage = await loadNextTrendingPage();
      if (!loadedPage) {
        break;
      }

      trendingPagesLoaded += 1;
    }

    const servicesToWarm = availableHomeServices().filter((service) => service.key !== "all" && service.providerId);

    for (const service of servicesToWarm) {
      await Promise.all([
        loadHomeServiceSupplement(service, "Movie", targetCount, HOME_BACKGROUND_PRELOAD_SUPPLEMENT_PAGES),
        loadHomeServiceSupplement(service, "Series", targetCount, HOME_BACKGROUND_PRELOAD_SUPPLEMENT_PAGES),
      ]);
    }

    if (state.view === "home") {
      renderFeatured();
    }
  } finally {
    state.homeServicePreloading = false;
  }
}

function featuredProviderPills(item, expanded = false) {
  const visibleProviders = expanded ? item.providers : item.providers.slice(0, 3);
  const pills = visibleProviders
    .map(
      (provider) => `
        <${provider.link ? "a" : "span"}
          class="featured-provider-pill ${provider.link ? "" : "is-disabled"}"
          ${provider.link ? `href="${escapeHtml(provider.link)}" target="_blank" rel="noreferrer noopener" data-provider-link="true"` : `aria-disabled="true"`}
        >
          ${provider.logo ? `<img src="${escapeHtml(provider.logo)}" alt="${escapeHtml(provider.name)} logo" />` : ""}
          <span>${escapeHtml(provider.name)}</span>
        </${provider.link ? "a" : "span"}>
      `
    )
    .join("");

  const moreButton = !expanded && item.providers.length > 3
    ? `<button class="featured-provider-more" type="button" data-expand-providers="${item.key}">+${item.providers.length - 3} more</button>`
    : "";

  return `${pills}${moreButton}`;
}

function renderFeatured() {
  if (!state.featuredItems.length) {
    setLoading(featuredMoviesGrid, "Live featured movies are loading.");
    setLoading(featuredSeriesGrid, "Live featured shows are loading.");
    return;
  }

  const services = availableHomeServices();
  const serviceWindow = homeServiceWindow();
  const featuredWindow = homeFeaturedWindow();
  const maxServiceOffset = Math.max(0, services.length - serviceWindow);
  state.homeServiceFilterOffset = Math.min(state.homeServiceFilterOffset, maxServiceOffset);
  const visibleServices = services.slice(
    state.homeServiceFilterOffset,
    state.homeServiceFilterOffset + serviceWindow
  );

  homeServiceFilters.innerHTML = visibleServices
    .map((service, index) => {
      const logo = serviceShelfLogo(service);
      const availableCount = service.streamCount || service.count;
      const availabilityLabel = availableCount
        ? `${availableCount} title${availableCount === 1 ? "" : "s"} available now`
        : "No titles in the current mix yet";

      return `
        <button
          class="service-filter-chip ${service.name === state.homeServiceFilter ? "is-active" : ""}"
          type="button"
          data-home-service="${escapeHtml(service.name)}"
          data-home-service-key="${escapeHtml(service.key)}"
          aria-pressed="${service.name === state.homeServiceFilter ? "true" : "false"}"
          aria-label="${escapeHtml(`${service.name}: ${availabilityLabel}`)}"
          title="${escapeHtml(`${service.name} • ${availabilityLabel}`)}"
          style="--shelf-index:${index}"
        >
          <span class="service-filter-chip-logo">
            <img
              class="service-filter-logo ${logo.className}"
              src="${logo.src}"
              alt="${escapeHtml(service.name)} logo"
              loading="lazy"
              decoding="async"
            />
          </span>
        </button>
      `;
    })
    .join("");

  homeServiceFilters.style.setProperty("--service-columns", String(visibleServices.length || 1));
  featuredMoviesGrid.style.setProperty("--carousel-columns", String(featuredWindow));
  featuredSeriesGrid.style.setProperty("--carousel-columns", String(featuredWindow));

  const activeServiceKey = serviceKeyFor(state.homeServiceFilter);
  const filteredMovies = featuredByType("Movie");
  const filteredSeries = featuredByType("Series");
  const rankedMovies = rankCuratedItems(filteredMovies, { activeServiceKey });
  const rankedSeries = rankCuratedItems(filteredSeries, { activeServiceKey });
  const movieItems = rankedMovies.slice(
    state.featuredMovieOffset,
    state.featuredMovieOffset + featuredWindow
  );
  const seriesItems = rankedSeries.slice(
    state.featuredSeriesOffset,
    state.featuredSeriesOffset + featuredWindow
  );

  const renderCard = (item, index) => {
    const providerBadge = (() => {
      const prov = preferredProvider(item.providers || []);
      if (!prov) {
        return "";
      }
      return `<span class="media-card-info-meta">${escapeHtml(prov.name)}</span>`;
    })();
    const libraryBadge = mediaCardLibraryBadgeMarkup(item);
    const requestAction = mediaCardRequestActionMarkup(item);
    return `
      <article class="media-card ${state.homePreviewKey === item.key ? "is-active" : ""}" data-open-details="${item.key}" style="--shelf-index:${index}" tabindex="0" aria-label="${escapeHtml(item.title)}, ${item.year}, ${escapeHtml(item.type)}">
        <div class="media-visual">
          ${libraryBadge}
          <img class="media-poster" src="${item.image}" alt="${escapeHtml(item.title)} poster art" loading="lazy" decoding="async" />
          ${requestAction}
          <div class="media-card-info">
            <p class="media-card-info-title">${escapeHtml(item.title)}</p>
            ${providerBadge}
          </div>
        </div>
      </article>
    `;
  };

  const movieLoadingMessage = state.homeServiceFilter === "All Services"
    ? "Loading featured movies..."
    : `Finding movies on ${state.homeServiceFilter}...`;
  const seriesLoadingMessage = state.homeServiceFilter === "All Services"
    ? "Loading featured shows..."
    : `Finding shows on ${state.homeServiceFilter}...`;

  const allServicesCta = state.homeServiceFilter !== "All Services"
    ? `<button class="empty-state-cta" type="button" data-home-service="All Services" data-home-service-key="all">Try All Services</button>`
    : "";

  if (movieItems.length) {
    featuredMoviesGrid.innerHTML = movieItems.map(renderCard).join("");
  } else if (state.homeServiceLoading && state.homeServiceFilter !== "All Services") {
    setLoading(featuredMoviesGrid, movieLoadingMessage);
  } else if (rankedSeries.length) {
    featuredMoviesGrid.innerHTML = `<div class="empty-state empty-state-inline">No movie picks are ready on ${escapeHtml(state.homeServiceFilter)} right now. The series row below has the current match.</div>`;
  } else {
    featuredMoviesGrid.innerHTML = `<div class="empty-state empty-state-inline">No streaming movies from ${escapeHtml(state.homeServiceFilter)} are in tonight's current mix yet. ${allServicesCta}</div>`;
  }

  if (seriesItems.length) {
    featuredSeriesGrid.innerHTML = seriesItems.map(renderCard).join("");
  } else if (state.homeServiceLoading && state.homeServiceFilter !== "All Services") {
    setLoading(featuredSeriesGrid, seriesLoadingMessage);
  } else if (rankedMovies.length) {
    featuredSeriesGrid.innerHTML = `<div class="empty-state empty-state-inline">No series picks are ready on ${escapeHtml(state.homeServiceFilter)} right now. The movie row above has the current match.</div>`;
  } else {
    featuredSeriesGrid.innerHTML = `<div class="empty-state empty-state-inline">No streaming shows from ${escapeHtml(state.homeServiceFilter)} are in tonight's current mix yet. ${allServicesCta}</div>`;
  }

  serviceFiltersPrevButton.disabled = state.homeServiceFilterOffset === 0;
  serviceFiltersNextButton.disabled = state.homeServiceFilterOffset + serviceWindow >= services.length;
  featuredMoviesPrevButton.disabled = state.featuredMovieOffset === 0;
  featuredSeriesPrevButton.disabled = state.featuredSeriesOffset === 0;
  featuredMoviesNextButton.disabled =
    state.homeServiceLoading ||
    state.trendingLoadingMore ||
    (state.featuredMovieOffset + featuredWindow >= rankedMovies.length && !state.trendingHasMore);
  featuredSeriesNextButton.disabled =
    state.homeServiceLoading ||
    state.trendingLoadingMore ||
    (state.featuredSeriesOffset + featuredWindow >= rankedSeries.length && !state.trendingHasMore);

  queueLibraryStatusChecks([...movieItems, ...seriesItems], featuredWindow * 2 + 6);
  updateHomeCardSelection();
}

function renderResults() {
  const items = filteredResults();
  const context = state.activeSearchContext;
  const label = formatSearchContextLabel(context);
  const itemNoun = state.resultsType === "Movies"
    ? "movie"
    : state.resultsType === "Series"
      ? "show"
      : "title";

  const shouldShowResults = context.mode !== "trending";
  resultsSection.hidden = !shouldShowResults;
  pageShell.classList.toggle("has-results", shouldShowResults);
  if (!shouldShowResults) {
    resultsGrid.innerHTML = "";
    resultsFeedFooter.innerHTML = "";
    return;
  }

  if (context.mode === "genre" && context.genreName) {
    resultsTitle.textContent = `Browsing ${context.genreName}`;
  } else if (context.mode === "service" && context.serviceName) {
    resultsTitle.textContent = `${context.serviceName} picks`;
  } else if (context.mode === "title" && context.query) {
    resultsTitle.textContent = `Showing results for "${context.query}"`;
  } else {
    resultsTitle.textContent = "Showing results";
  }

  resultsSummary.textContent = items.length
    ? `${items.length} ${itemNoun}${items.length === 1 ? "" : "s"} currently in view${context.mode === "title" && context.query ? ` for ${label}` : context.mode === "service" || context.mode === "genre" ? ` for ${label}` : ""}.`
    : `No titles matched ${label}. Try a different title, genre, or streamer.`;

  if (!items.length) {
    resultsGrid.innerHTML = `<div class="empty-state">No live titles matched your current search and filters.</div>`;
    resultsFeedFooter.innerHTML = "";
    return;
  }

  resultsGrid.innerHTML = items
    .map((item) => {
      const prov = preferredProvider(item.providers || []);
      const provBadge = prov ? `<span class="media-card-info-meta">${escapeHtml(prov.name)}</span>` : "";
      const libraryBadge = mediaCardLibraryBadgeMarkup(item);
      const requestAction = mediaCardRequestActionMarkup(item);
      return `
        <article class="media-card result-poster-card ${state.homePreviewKey === item.key ? "is-active" : ""}" data-open-details="${item.key}" tabindex="0" aria-label="${escapeHtml(item.title)}, ${item.year}, ${escapeHtml(item.type)}">
          <div class="media-visual">
            ${libraryBadge}
            <img class="media-poster" src="${item.image}" alt="${escapeHtml(item.title)} artwork" loading="lazy" decoding="async" />
            ${requestAction}
            <div class="media-card-info">
              <p class="media-card-info-title">${escapeHtml(item.title)}</p>
              ${provBadge}
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  if (state.resultsLoadingMore) {
    resultsFeedFooter.innerHTML = `<div class="loading-card">Loading more titles...</div>`;
  } else if (state.resultsAutoLoadCount >= 12) {
    resultsFeedFooter.innerHTML = `
      <div class="results-nudge">
        <strong>Still browsing?</strong>
        <p>You have covered a lot of ground. W.D.I.S. has already narrowed things down to titles you can actually watch, so now it might be time to hit play.</p>
      </div>
    `;
  } else if (state.resultsHasMore) {
    resultsFeedFooter.innerHTML = `<button class="load-more-button" type="button" data-load-more="true">Load more titles</button>`;
  } else {
    resultsFeedFooter.innerHTML = "";
  }

  queueLibraryStatusChecks(items, 30);
  updateHomeCardSelection();
}

function clearPersonSpotlight() {
  state.selectedPersonId = null;
  personSpotlightSection.hidden = true;
  personSpotlightTitle.textContent = "Select a person";
  personSpotlightSummary.textContent = "";
  personSpotlightContent.innerHTML = "";
}

async function fetchPerson(id) {
  if (state.personCache.has(id)) {
    return state.personCache.get(id);
  }

  const [person, credits] = await Promise.all([
    tmdbFetch(`/person/${id}`, { language: TMDB.language }),
    tmdbFetch(`/person/${id}/combined_credits`, { language: TMDB.language }),
  ]);

  const seen = new Set();
  const creditItems = sortByRecommendationScore(
    (credits.cast || [])
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .map((item) => normalizeSummary(item))
      .filter((item) => {
        if (!item || seen.has(item.key)) {
          return false;
        }

        seen.add(item.key);
        return true;
      })
  )
    .filter((item) => item.image && item.title)
    .slice(0, 12);

  const normalized = {
    id: person.id,
    name: person.name || "Unknown cast member",
    knownForDepartment: person.known_for_department || "Cast",
    biography: person.biography || "",
    birthday: person.birthday || "",
    placeOfBirth: person.place_of_birth || "",
    image: imageUrl(person.profile_path, TMDB.profileSize),
    credits: creditItems,
  };

  setCached(state.personCache, id, normalized, CACHE_LIMITS.person);
  return normalized;
}

function renderPersonSpotlight(person) {
  if (!person) {
    clearPersonSpotlight();
    return;
  }

  personSpotlightSection.hidden = false;
  personSpotlightTitle.textContent = person.name;
  personSpotlightSummary.textContent = person.credits.length
    ? `${person.credits.length} associated title${person.credits.length === 1 ? "" : "s"} ready to explore.`
    : "No additional associated titles were returned for this person yet.";

  const biography = person.biography || `${person.name} does not have a biography available yet.`;
  const detailLine = [
    person.knownForDepartment,
    person.birthday ? `Born ${person.birthday}` : "",
    person.placeOfBirth || "",
  ].filter(Boolean).join(" • ");

  personSpotlightContent.innerHTML = `
    <div class="person-spotlight-card">
      <div class="person-spotlight-header">
        <img class="person-spotlight-portrait" src="${escapeHtml(person.image)}" alt="${escapeHtml(person.name)} portrait" loading="lazy" decoding="async" />
        <div class="person-spotlight-copy">
          <p class="panel-kicker">${escapeHtml(
            person.knownForDepartment && person.knownForDepartment !== "Acting" ? "Crew spotlight" : "Cast spotlight"
          )}</p>
          <h3>${escapeHtml(person.name)}</h3>
          <p class="result-meta">${escapeHtml(detailLine || "Film and TV credits")}</p>
          <p class="detail-summary clamp-4">${escapeHtml(biography)}</p>
        </div>
      </div>
      ${
        person.credits.length
          ? `<div class="person-credits-grid">
              ${person.credits
                .map(
                  (item) => `
                    <article class="person-credit-card" data-open-details="${item.key}">
                      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)} artwork" loading="lazy" decoding="async" />
                      <div class="person-credit-copy">
                        <p class="meta-kicker">${escapeHtml(item.type)}</p>
                        <h3>${escapeHtml(item.title)}</h3>
                        <p class="result-meta">${item.year} • ${escapeHtml(item.genre)} • Rated ${escapeHtml(item.rating)}</p>
                      </div>
                    </article>
                  `
                )
                .join("")}
            </div>`
          : `<div class="empty-state">No associated movie or TV credits were returned for this person.</div>`
      }
    </div>
  `;
}

async function openPersonSpotlight(id) {
  if (!id) {
    return;
  }

  state.selectedPersonId = String(id);
  personSpotlightSection.hidden = false;
  personSpotlightTitle.textContent = "Loading people spotlight...";
  personSpotlightSummary.textContent = "";
  personSpotlightContent.innerHTML = `<div class="loading-card">Loading associated titles...</div>`;
  renderDetails(state.detailCache.get(state.selectedKey));

  try {
    const person = await fetchPerson(id);
    renderPersonSpotlight(person);
    personSpotlightSection.scrollIntoView({ block: "start", behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
  } catch (error) {
    personSpotlightSection.hidden = false;
    personSpotlightTitle.textContent = "People spotlight";
    personSpotlightSummary.textContent = "";
    personSpotlightContent.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

function renderDetails(detail) {
  if (!detail) {
    detailHero.innerHTML = "";
    detailProviders.innerHTML = "";
    detailStats.innerHTML = "";
    detailTrailer.innerHTML = "";
    detailInsights.innerHTML = "";
    castGrid.innerHTML = `<div class="empty-state">Search for a title to load details.</div>`;
    crewGrid.innerHTML = "";
    relatedGrid.innerHTML = "";
    clearPersonSpotlight();
    return;
  }

  detailHero.style.setProperty("--detail-image", `url("${detail.backdrop}")`);
  const primaryProvider = preferredProvider(detail.providers);
  const requestUi = getRequestUiState(detail);
  const requestFeedback = requestFeedbackMarkup(requestUi);
  detailHero.innerHTML = `
    <div class="detail-hero-content">
      <p class="eyebrow">${escapeHtml(detail.genre)} / ${escapeHtml(detail.type)}</p>
      <h1>${escapeHtml(detail.title)}</h1>
      <p class="detail-meta">${detail.year} • ${escapeHtml(detail.runtime)} • ${escapeHtml(detail.maturity)} • Rated ${escapeHtml(detail.rating)}</p>
      <p class="detail-summary">${escapeHtml(detail.overview)}</p>
      <div class="detail-pill-row">
        ${detail.providers.slice(0, 5).map((provider) => `<span class="detail-pill">${escapeHtml(provider.name)}</span>`).join("")}
      </div>
      <div class="detail-actions">
        ${
          primaryProvider?.link
            ? `<a class="action-button" href="${escapeHtml(primaryProvider.link)}" target="_blank" rel="noreferrer noopener" data-provider-link="true">
                ${primaryProvider.accessType === "rent" || primaryProvider.accessType === "buy" ? "Buy or Rent" : "Watch Now"}
              </a>`
            : `<span class="action-button action-button-disabled" aria-disabled="true">Availability unavailable</span>`
        }
        ${requestActionButtonMarkup(detail, requestUi)}
      </div>
      ${requestFeedback.message}
      ${requestFeedback.troubleshooting}
    </div>
  `;

  detailProviders.innerHTML = detail.providers.length
    ? detail.providers
        .map(
          (provider) => `
            <${provider.link ? "a" : "div"} class="provider-link ${provider.link ? "" : "is-disabled"}" ${provider.link ? `href="${escapeHtml(provider.link)}" target="_blank" rel="noreferrer noopener" data-provider-link="true"` : `aria-disabled="true"`}>
              <span class="provider-brand">
                ${provider.logo ? `<img src="${escapeHtml(provider.logo)}" alt="${escapeHtml(provider.name)} logo" />` : ""}
                <span>
                  <strong>${escapeHtml(provider.name)}</strong>
                  <small>${escapeHtml(provider.note)}</small>
                </span>
              </span>
              <span class="inline-link">${provider.link ? escapeHtml(provider.linkLabel || accessTypeLabel(provider.accessType)) : "Unavailable"}</span>
            </${provider.link ? "a" : "div"}>
          `
        )
        .join("")
    : `<div class="empty-state">No US watch providers were returned for this title.</div>`;

  detailStats.innerHTML = Object.entries(detail.details)
    .map(
      ([label, value]) => `
        <div class="detail-stat">
          <label>${escapeHtml(label)}</label>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `
    )
    .join("");

  detailTrailer.innerHTML = detail.trailer
    ? `
        <div class="detail-trailer-shell">
          <iframe class="detail-trailer-embed" src="${escapeHtml(detail.trailer)}"
            title="${escapeHtml(detail.title)} trailer" loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
          <p class="detail-support-copy">
            If playback is blocked in-page, <a class="inline-link" href="${escapeHtml(detail.trailerLink)}" target="_blank" rel="noreferrer noopener" data-provider-link="true">open the trailer on YouTube</a>.
          </p>
        </div>
      `
    : `<div class="empty-state detail-inline-empty">Trailer preview is not available for this title yet.</div>`;

  const genrePills = detail.genres.length
    ? `<div class="detail-genre-row">${detail.genres
        .map((genre) => `<span class="detail-pill">${escapeHtml(genre)}</span>`)
        .join("")}</div>`
    : "";
  const providerSummary = detail.providers.length
    ? `<p class="detail-support-copy">Watch options currently include ${escapeHtml(joinNaturalList(detail.providers.slice(0, 4).map((provider) => provider.name)))}.</p>`
    : `<p class="detail-support-copy">Watch availability still depends on the services currently carrying this title.</p>`;

  detailInsights.innerHTML = `
    <div class="detail-subsection-heading">
      <h3>What else to know</h3>
    </div>
    ${detail.tagline ? `<p class="detail-tagline">"${escapeHtml(detail.tagline)}"</p>` : ""}
    ${genrePills}
    <div class="detail-insights-grid">
      ${detail.insights
        .map(
          (item) => `
            <div class="detail-insight">
              <label>${escapeHtml(item.label)}</label>
              <strong>${escapeHtml(item.value)}</strong>
            </div>
          `
        )
        .join("")}
    </div>
    ${providerSummary}
  `;

  castGrid.innerHTML = detail.cast.length
    ? detail.cast
        .map(
          (person) => `
            <article class="cast-card ${String(person.id) === state.selectedPersonId ? "is-active" : ""}" data-open-person="${person.id}">
              <img src="${person.image}" alt="${escapeHtml(person.name)} portrait" loading="lazy" decoding="async" />
              <h3>${escapeHtml(person.name)}</h3>
              <p>${escapeHtml(person.role)}</p>
            </article>
          `
        )
        .join("")
    : `<div class="empty-state">Cast information is not available for this title yet.</div>`;

  crewGrid.innerHTML = detail.crew.length
    ? detail.crew
        .map(
          (person) => `
            <article class="cast-card ${String(person.id) === state.selectedPersonId ? "is-active" : ""}" data-open-person="${person.id}">
              <img src="${person.image}" alt="${escapeHtml(person.name)} portrait" loading="lazy" decoding="async" />
              <h3>${escapeHtml(person.name)}</h3>
              <p>${escapeHtml(person.role)}</p>
            </article>
          `
        )
        .join("")
    : `<div class="empty-state">Crew information is not available for this title yet.</div>`;

  relatedGrid.innerHTML = detail.related.length
    ? detail.related
        .map(
          (item) => `
            <article class="related-card" data-open-details="${item.key}">
              <img src="${item.image}" alt="${escapeHtml(item.title)} artwork" loading="lazy" decoding="async" />
              <div class="related-copy">
                <p class="eyebrow">${escapeHtml(item.type)}</p>
                <h3>${escapeHtml(item.title)}</h3>
                <p class="detail-summary clamp-4">${escapeHtml(item.overview)}</p>
              </div>
            </article>
          `
        )
        .join("")
    : `<div class="empty-state">No related titles were returned for this title.</div>`;
}

function applyRequestServicesSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return;
  }

  ["radarr", "sonarr"].forEach((serviceName) => {
    const status = snapshot[serviceName];
    if (!status) {
      return;
    }

    setRequestServiceState(serviceName, {
      configured: Boolean(status.configured),
      connected: Boolean(status.connected ?? status.available),
      message: status.message || `${requestServiceLabel(serviceName)} status unavailable.`,
      troubleshooting: normalizeRequestTroubleshooting(status.troubleshooting, serviceName),
    });
  });

  state.requestServiceStatusLoaded = true;
}

function populateSettingsForm(settings) {
  if (!settings) {
    return;
  }

  settingsTmdbTokenInput.value = settings.tmdbToken || "";
  settingsRadarrHostInput.value = settings.radarr?.host || "";
  settingsRadarrApiKeyInput.value = settings.radarr?.apiKey || "";
  settingsRadarrRootInput.value = settings.radarr?.rootFolder || "";
  settingsRadarrQualityInput.value = settings.radarr?.qualityProfileId || 1;
  settingsSonarrHostInput.value = settings.sonarr?.host || "";
  settingsSonarrApiKeyInput.value = settings.sonarr?.apiKey || "";
  settingsSonarrRootInput.value = settings.sonarr?.rootFolder || "";
  settingsSonarrQualityInput.value = settings.sonarr?.qualityProfileId || 1;
}

function settingsPayloadFromForm() {
  return {
    tmdbToken: settingsTmdbTokenInput.value.trim(),
    radarr: {
      host: settingsRadarrHostInput.value.trim(),
      apiKey: settingsRadarrApiKeyInput.value.trim(),
      rootFolder: settingsRadarrRootInput.value.trim(),
      qualityProfileId: Number.parseInt(settingsRadarrQualityInput.value || "1", 10) || 1,
    },
    sonarr: {
      host: settingsSonarrHostInput.value.trim(),
      apiKey: settingsSonarrApiKeyInput.value.trim(),
      rootFolder: settingsSonarrRootInput.value.trim(),
      qualityProfileId: Number.parseInt(settingsSonarrQualityInput.value || "1", 10) || 1,
    },
  };
}

async function loadSettings() {
  settingsFeedback.textContent = "Loading settings...";
  settingsFeedback.classList.remove("is-error", "is-success");

  try {
    const response = await fetch("/api/settings", {
      headers: { Accept: "application/json" },
    });
    const contentType = response.headers.get("content-type") || "";
    const body = await parseJsonResponse(response);
    if (response.status === 404 || contentType.includes("text/html")) {
      throw new Error("Settings API is unavailable in this runtime. Start W.D.I.S. in serve mode.");
    }
    if (!response.ok || !body?.settings) {
      throw new Error(body?.message || "Could not load settings.");
    }

    populateSettingsForm(body.settings);
    applyRequestServicesSnapshot(body.requestServices);
    state.settingsLoaded = true;
    settingsFeedback.textContent = "Settings loaded.";
    settingsFeedback.classList.add("is-success");
  } catch (error) {
    settingsFeedback.textContent = error.message || "Could not load settings.";
    settingsFeedback.classList.add("is-error");
  }
}

async function saveSettings() {
  const payload = settingsPayloadFromForm();
  state.settingsSaving = true;
  settingsSaveButton.disabled = true;
  settingsFeedback.textContent = "Saving settings...";
  settingsFeedback.classList.remove("is-error", "is-success");

  try {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const contentType = response.headers.get("content-type") || "";
    const body = await parseJsonResponse(response);
    if (response.status === 404 || contentType.includes("text/html")) {
      throw new Error("Settings API is unavailable in this runtime. Start W.D.I.S. in serve mode.");
    }
    if (!response.ok || !body?.settings) {
      throw new Error(body?.message || "Could not save settings.");
    }

    populateSettingsForm(body.settings);
    applyRequestServicesSnapshot(body.requestServices);
    settingsFeedback.textContent = "Settings saved and connectivity re-checked.";
    settingsFeedback.classList.add("is-success");
    state.settingsLoaded = true;

    // Refresh home feeds and library using the latest token/provider settings.
    state.featuredItems = [];
    state.resultsItems = [];
    state.itemCache.clear();
    state.previewCache.clear();
    state.detailCache.clear();
    resetHomepageToTrendingContext({ clearInputs: true });
    await bootstrapLiveData();
    if (state.view === "library") {
      await loadLibrary();
    }
  } catch (error) {
    settingsFeedback.textContent = error.message || "Could not save settings.";
    settingsFeedback.classList.add("is-error");
  } finally {
    state.settingsSaving = false;
    settingsSaveButton.disabled = false;
  }
}

function bytesLabel(value) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function libraryGenreCatalog() {
  const counts = new Map();
  const catalog = [...state.libraryMovies, ...state.librarySeries];

  catalog.forEach((item) => {
    const genres = Array.isArray(item.genres) ? item.genres : [];
    genres
      .map((genre) => String(genre || "").trim())
      .filter(Boolean)
      .forEach((genre) => {
        counts.set(genre, (counts.get(genre) || 0) + 1);
      });
  });

  return [...counts.entries()]
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0], undefined, { sensitivity: "base" }))
    .map(([genre]) => genre);
}

function libraryGenreOptions(limit = 12) {
  const ranked = libraryGenreCatalog();
  const options = ranked.slice(0, limit);
  if (
    state.libraryGenre &&
    state.libraryGenre !== LIBRARY_ALL_GENRES &&
    ranked.includes(state.libraryGenre) &&
    !options.includes(state.libraryGenre)
  ) {
    options.push(state.libraryGenre);
  }

  return [LIBRARY_ALL_GENRES, ...options];
}

function resolveLibraryTypeQuery(query) {
  const normalized = normalizeServiceName(query);
  if (!normalized) {
    return null;
  }

  const aliasToType = new Map([
    ["movie", "Movies"],
    ["movies", "Movies"],
    ["film", "Movies"],
    ["films", "Movies"],
    ["tv", "Series"],
    ["series", "Series"],
    ["show", "Series"],
    ["shows", "Series"],
    ["tvshow", "Series"],
    ["tvshows", "Series"],
  ]);

  return aliasToType.get(normalized) || null;
}

function resolveLibraryGenreQuery(query) {
  const normalized = normalizeServiceName(query);
  if (!normalized) {
    return null;
  }

  const genres = libraryGenreCatalog();
  const exactMatch = genres.find((genre) => normalizeServiceName(genre) === normalized);
  if (exactMatch) {
    return exactMatch;
  }

  return genres.find((genre) => normalizeServiceName(genre).includes(normalized)) || null;
}

function applyLibrarySearchQuery(rawQuery, options = {}) {
  const { clearSuggestionPanel = true } = options;
  const trimmed = String(rawQuery || "").trim();
  const typeMatch = resolveLibraryTypeQuery(trimmed);
  const genreMatch = resolveLibraryGenreQuery(trimmed);

  if (typeMatch) {
    state.libraryType = typeMatch;
  }
  if (genreMatch) {
    state.libraryGenre = genreMatch;
  }

  // Keep the free-text term only when query isn't a pure type/genre intent.
  state.libraryQuery = typeMatch || genreMatch ? "" : trimmed;
  librarySearchInput.value = state.libraryQuery;

  if (clearSuggestionPanel) {
    renderLibrarySuggestions([]);
  }
}

function libraryItemMatchesFilters(item, mediaType) {
  const typeMatches = state.libraryType === "All"
    || (state.libraryType === "Movies" && mediaType === "movie")
    || (state.libraryType === "Series" && mediaType === "tv");
  if (!typeMatches) {
    return false;
  }

  if (state.libraryGenre !== LIBRARY_ALL_GENRES) {
    const itemGenres = Array.isArray(item.genres) ? item.genres : [];
    const matchesGenre = itemGenres.some((genre) => normalizeServiceName(genre) === normalizeServiceName(state.libraryGenre));
    if (!matchesGenre) {
      return false;
    }
  }

  const term = state.libraryQuery.trim().toLowerCase();
  if (!term) {
    return true;
  }

  const searchableParts = [
    item.title,
    item.year,
    item.status,
    item.network,
    item.path,
    ...(Array.isArray(item.genres) ? item.genres : []),
  ]
    .filter(Boolean)
    .map((value) => String(value));

  const searchText = searchableParts.join(" ").toLowerCase();
  const normalizedHaystack = normalizeServiceName(searchableParts.join(" "));
  const normalizedNeedle = normalizeServiceName(term);

  return searchText.includes(term) || (normalizedNeedle && normalizedHaystack.includes(normalizedNeedle));
}

function filteredLibraryMovies() {
  return state.libraryMovies.filter((item) => libraryItemMatchesFilters(item, "movie"));
}

function filteredLibrarySeries() {
  return state.librarySeries.filter((item) => libraryItemMatchesFilters(item, "tv"));
}

function libraryRecordById(mediaType, id) {
  const targetId = Number(id);
  if (!targetId) {
    return null;
  }

  const source = mediaType === "movie" ? state.libraryMovies : state.librarySeries;
  return source.find((entry) => Number(entry.id) === targetId) || null;
}

function buildLibrarySummary(item, mediaType, tmdbId) {
  const key = keyFor(mediaType, tmdbId);
  const primaryGenre = Array.isArray(item.genres) ? item.genres.find(Boolean) : "";
  const year = item.year ? String(item.year) : "TBD";
  const releaseDateRaw = item.year ? `${item.year}-01-01` : "";
  const summary = {
    id: tmdbId,
    mediaType,
    key,
    title: item.title || "Untitled",
    type: mediaType === "tv" ? "Series" : "Movie",
    year,
    genre: primaryGenre || (mediaType === "tv" ? "Series" : "Movie"),
    rating: "NR",
    voteAverage: 0,
    voteCount: 0,
    popularity: 0,
    genreIds: [],
    releaseDateRaw,
    availability: "Open details for streaming options",
    providers: [],
    image: item.poster || imageUrl("", TMDB.posterSize),
    backdrop: item.poster || imageUrl("", TMDB.backdropSize),
    overview: item.overview || "No synopsis is available yet.",
  };

  setCached(state.itemCache, key, summary, CACHE_LIMITS.item);
  return summary;
}

async function resolveLibraryTvTmdbId(tvdbId) {
  const normalizedTvdbId = Number(tvdbId || 0);
  if (!normalizedTvdbId || !hasToken()) {
    return null;
  }

  if (libraryTvdbToTmdbCache.has(normalizedTvdbId)) {
    return libraryTvdbToTmdbCache.get(normalizedTvdbId);
  }

  if (libraryTvdbLookupCache.has(normalizedTvdbId)) {
    return libraryTvdbLookupCache.get(normalizedTvdbId);
  }

  const request = (async () => {
    const data = await tmdbFetch(`/find/${normalizedTvdbId}`, {
      external_source: "tvdb_id",
      language: TMDB.language,
    }, { timeout: 0 });
    const tmdbId = Number(data?.tv_results?.[0]?.id || 0) || null;
    if (tmdbId) {
      libraryTvdbToTmdbCache.set(normalizedTvdbId, tmdbId);
    }
    return tmdbId;
  })()
    .catch(() => null)
    .finally(() => {
      libraryTvdbLookupCache.delete(normalizedTvdbId);
    });

  libraryTvdbLookupCache.set(normalizedTvdbId, request);
  return request;
}

async function resolveLibraryPreviewKey(item, mediaType) {
  if (!item) {
    return null;
  }

  if (mediaType === "movie") {
    const tmdbId = Number(item.tmdbId || 0);
    if (!tmdbId) {
      return null;
    }
    buildLibrarySummary(item, "movie", tmdbId);
    return keyFor("movie", tmdbId);
  }

  const directTmdbId = Number(item.tmdbId || 0);
  const tmdbId = directTmdbId || await resolveLibraryTvTmdbId(item.tvdbId);
  if (!tmdbId) {
    return null;
  }
  buildLibrarySummary(item, "tv", tmdbId);
  return keyFor("tv", tmdbId);
}

async function openLibraryPreview(mediaType, libraryId, triggerEl = null) {
  const item = libraryRecordById(mediaType, libraryId);
  if (!item) {
    return;
  }

  const existingKey = triggerEl?.dataset?.openDetails || "";
  if (existingKey) {
    const { id } = splitKey(existingKey);
    const tmdbId = Number(id || 0);
    if (tmdbId) {
      buildLibrarySummary(item, mediaType, tmdbId);
      await openHomePreview(existingKey, triggerEl);
      return;
    }
  }

  if (!hasToken()) {
    libraryStatus.textContent = "Preview is unavailable until TMDB access is configured in Settings.";
    return;
  }

  const previewKey = await resolveLibraryPreviewKey(item, mediaType);
  if (!previewKey) {
    libraryStatus.textContent = `Preview isn't available for ${item.title} yet because the TMDB match could not be resolved.`;
    return;
  }

  if (triggerEl) {
    triggerEl.dataset.openDetails = previewKey;
  }

  await openHomePreview(previewKey, triggerEl);
}

function renderLibraryCard(item, mediaType) {
  const poster = item.poster || imageUrl("", TMDB.posterSize);
  const availabilityLine = mediaType === "movie"
    ? [item.year, item.status].filter(Boolean).join(" • ")
    : [item.year, item.network || item.status].filter(Boolean).join(" • ");
  const diskLabel = bytesLabel(item.sizeOnDisk);
  const meta = [availabilityLine, diskLabel].filter(Boolean).join(" • ") || (mediaType === "movie" ? "Movie" : "Series");
  const cardLabel = `${item.title}, ${mediaType === "movie" ? "movie" : "series"}${item.year ? `, ${item.year}` : ""}`;
  const knownTmdbId = Number(item.tmdbId || 0);
  const knownPreviewKey = knownTmdbId ? keyFor(mediaType, knownTmdbId) : "";
  const previewDataAttr = knownPreviewKey ? `data-open-details="${knownPreviewKey}"` : "";

  return `
    <article
      class="media-card result-poster-card library-media-card"
      data-library-open="true"
      data-library-media-type="${mediaType}"
      data-library-id="${Number(item.id || 0)}"
      ${previewDataAttr}
      tabindex="0"
      role="button"
      aria-label="${escapeHtml(cardLabel)}"
    >
      <div class="media-visual">
        <img class="media-poster" src="${escapeHtml(poster)}" alt="${escapeHtml(item.title)} artwork" loading="lazy" decoding="async" />
        <div class="media-card-actions">
          <button
            class="action-button request-action-button is-remove media-card-request-button"
            type="button"
            data-library-remove="${mediaType}"
            data-library-id="${Number(item.id || 0)}"
            data-library-title="${escapeHtml(item.title)}"
          >
            Remove
          </button>
        </div>
        <div class="media-card-info">
          <p class="media-card-info-title">${escapeHtml(item.title)}</p>
          <span class="media-card-info-meta">${escapeHtml(meta)}</span>
        </div>
      </div>
    </article>
  `;
}

function renderLibrary() {
  renderChipSet(libraryGenreChips, libraryGenreOptions(), state.libraryGenre, "library-genre");
  renderChipSet(libraryTypeFilters, libraryTypes, state.libraryType, "library-type");

  const movies = filteredLibraryMovies();
  const series = filteredLibrarySeries();
  const total = state.libraryMovies.length + state.librarySeries.length;
  const visible = movies.length + series.length;
  const activeFilters = [
    state.libraryType !== "All" ? state.libraryType : "",
    state.libraryGenre !== LIBRARY_ALL_GENRES ? state.libraryGenre : "",
    state.libraryQuery ? `“${state.libraryQuery}”` : "",
  ].filter(Boolean);
  const filterLabel = activeFilters.length ? ` using ${activeFilters.join(" + ")}.` : ".";
  librarySummary.textContent = total
    ? `${visible} of ${total} titles currently match${filterLabel}`
    : "No titles found yet. Connect services in Settings, then refresh.";
  libraryStatus.textContent = state.libraryStatus || "";

  libraryMoviesGrid.innerHTML = movies.length
    ? movies.map((item) => renderLibraryCard(item, "movie")).join("")
    : `<div class="empty-state">No movies match your current library filters.</div>`;

  librarySeriesGrid.innerHTML = series.length
    ? series.map((item) => renderLibraryCard(item, "tv")).join("")
    : `<div class="empty-state">No TV shows match your current library filters.</div>`;
}

async function loadLibrary() {
  state.libraryLoading = true;
  libraryStatus.textContent = "Loading your library...";

  try {
    const response = await fetch("/api/library", {
      headers: { Accept: "application/json" },
    });
    const body = await parseJsonResponse(response);
    if (!response.ok || !body?.success) {
      throw new Error(body?.message || "Could not load library.");
    }

    state.libraryMovies = Array.isArray(body.movies) ? body.movies : [];
    state.librarySeries = Array.isArray(body.series) ? body.series : [];
    if (state.libraryGenre !== LIBRARY_ALL_GENRES) {
      const availableGenres = new Set(libraryGenreCatalog());
      if (!availableGenres.has(state.libraryGenre)) {
        state.libraryGenre = LIBRARY_ALL_GENRES;
      }
    }

    const messages = [];
    if (body.services?.radarr?.message && !body.services.radarr.available) {
      messages.push(`Movies: ${body.services.radarr.message}`);
    }
    if (body.services?.sonarr?.message && !body.services.sonarr.available) {
      messages.push(`TV: ${body.services.sonarr.message}`);
    }
    state.libraryStatus = messages.join(" ");
    renderLibrary();
  } catch (error) {
    state.libraryMovies = [];
    state.librarySeries = [];
    state.libraryStatus = error.message || "Could not load library.";
    renderLibrary();
  } finally {
    state.libraryLoading = false;
  }
}

async function removeLibraryItem(mediaType, id, title = "") {
  if (!id) {
    return;
  }

  const endpoint = mediaType === "movie" ? "/api/library/movie/remove" : "/api/library/tv/remove";
  const payload = mediaType === "movie"
    ? { movieId: Number(id), deleteFiles: true }
    : { seriesId: Number(id), deleteFiles: true };

  libraryStatus.textContent = `Removing ${title || "title"}...`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const body = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error(body?.message || "Could not remove title.");
    }

    await loadLibrary();
    libraryStatus.textContent = body?.message || "Removed from library.";
  } catch (error) {
    libraryStatus.textContent = error.message || "Could not remove title.";
  }
}

function renderStaticUi() {
  renderHomepageGenreCue();
  renderChipSet(genreChips, HOME_GENRE_CHIPS, state.genre, "genre");
  renderChipSet(resultTypeFilters, resultTypes, state.resultsType, "type");
  renderLibrary();
  renderFeatured();
  renderResults();
}

async function fetchSearchSuggestions(query, signal = null) {
  const trimmed = query.trim();

  if (!trimmed || trimmed.length < 2 || !hasToken()) {
    return [];
  }

  const data = await tmdbFetch("/search/multi", {
    query: trimmed,
    language: TMDB.language,
    include_adult: "false",
    page: 1,
  }, { signal, timeout: 0 });

  const items = (data.results || [])
    .filter((item) => item.media_type === "movie" || item.media_type === "tv")
    .slice(0, 6)
    .map((item) => {
      const normalized = normalizeSummary(item);
      const cached = state.itemCache.get(normalized.key);
      if (Array.isArray(cached?.providers) && cached.providers.length) {
        normalized.providers = cached.providers;
        normalized.availability = cached.availability || normalized.availability;
        normalized.isAvailable = cached.isAvailable ?? hasSupportedAvailability(cached.providers);
      }
      return normalized;
    });

  const missingProviders = items.filter((entry) => !Array.isArray(entry.providers) || !entry.providers.length);
  if (missingProviders.length) {
    await attachProviders(missingProviders, missingProviders.length, 6, { signal });
  }

  queueLibraryStatusChecks(items, items.length);
  return items;
}

function suggestionServiceLabel(item) {
  const provider = preferredProvider(item.providers || []);
  if (!provider) {
    return "Service: Not listed";
  }

  return `Service: ${provider.name} (${accessTypeLabel(provider.accessType)})`;
}

function suggestionRequestActionMarkup(item) {
  const requestUi = compactRequestUiState(item);
  return requestActionButtonMarkup(item, requestUi, "search-suggestion-request-button");
}

function renderSuggestions(container, items) {
  const suggestionItems = Array.isArray(items) ? items.slice(0, 6) : [];

  if (container === heroSearchSuggestions) {
    state.heroSuggestions = suggestionItems;
  } else if (container === resultsSearchSuggestions) {
    state.resultsSuggestions = suggestionItems;
  }

  if (!suggestionItems.length) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  container.hidden = false;
  container.innerHTML = suggestionItems
    .map(
      (item) => `
        <div class="search-suggestion-row">
          <button class="search-suggestion search-suggestion-main" type="button" data-suggestion-key="${escapeHtml(item.key)}">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)} artwork" loading="lazy" decoding="async" />
            <span class="search-suggestion-copy">
              <strong>${escapeHtml(item.title)}</strong>
              <small class="search-suggestion-meta">${item.year} • ${escapeHtml(item.type)} • ${escapeHtml(item.genre)}</small>
              <small class="search-suggestion-service">${escapeHtml(suggestionServiceLabel(item))}</small>
            </span>
          </button>
          ${suggestionRequestActionMarkup(item)}
        </div>
      `
    )
    .join("");
}

function fetchLibrarySuggestions(query) {
  const trimmed = String(query || "").trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  const needle = trimmed.toLowerCase();
  const normalizedNeedle = normalizeServiceName(trimmed);

  const candidates = [];
  if (state.libraryType === "All" || state.libraryType === "Movies") {
    state.libraryMovies.forEach((item) => {
      candidates.push({ ...item, mediaType: "movie" });
    });
  }
  if (state.libraryType === "All" || state.libraryType === "Series") {
    state.librarySeries.forEach((item) => {
      candidates.push({ ...item, mediaType: "tv" });
    });
  }

  const selectedGenreKey = normalizeServiceName(state.libraryGenre);
  const filtered = candidates
    .filter((item) => {
      if (state.libraryGenre === LIBRARY_ALL_GENRES) {
        return true;
      }
      const genres = Array.isArray(item.genres) ? item.genres : [];
      return genres.some((genre) => normalizeServiceName(genre) === selectedGenreKey);
    })
    .map((item) => {
      const genres = Array.isArray(item.genres) ? item.genres : [];
      const haystack = [item.title, item.year, item.status, item.network, ...genres]
        .filter(Boolean)
        .map((value) => String(value))
        .join(" ");
      const lowerHaystack = haystack.toLowerCase();
      const normalizedHaystack = normalizeServiceName(haystack);
      const titleLower = String(item.title || "").toLowerCase();
      const score = titleLower.startsWith(needle) ? 0 : titleLower.includes(needle) ? 1 : 2;

      return {
        item,
        score,
        lowerHaystack,
        normalizedHaystack,
      };
    })
    .filter((entry) => (
      entry.lowerHaystack.includes(needle)
      || (normalizedNeedle && entry.normalizedHaystack.includes(normalizedNeedle))
    ))
    .sort((a, b) => (
      a.score - b.score
      || String(a.item.title || "").localeCompare(String(b.item.title || ""), undefined, { sensitivity: "base" })
    ))
    .slice(0, 6)
    .map((entry) => {
      const item = entry.item;
      const genres = Array.isArray(item.genres) ? item.genres : [];
      return {
        title: item.title || "Unknown title",
        query: item.title || "",
        poster: item.poster || imageUrl("", TMDB.posterSize),
        type: item.mediaType === "movie" ? "Movie" : "Series",
        year: item.year || "—",
        genre: genres[0] || "Library title",
      };
    });

  return filtered;
}

function renderLibrarySuggestions(items) {
  if (!librarySearchSuggestions) {
    return;
  }

  if (!items.length) {
    librarySearchSuggestions.hidden = true;
    librarySearchSuggestions.innerHTML = "";
    return;
  }

  librarySearchSuggestions.hidden = false;
  librarySearchSuggestions.innerHTML = items
    .map(
      (item) => `
        <button class="search-suggestion" type="button" data-library-suggestion="${escapeHtml(item.query)}">
          <img src="${escapeHtml(item.poster)}" alt="${escapeHtml(item.title)} artwork" loading="lazy" decoding="async" />
          <span>
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(String(item.year))} • ${escapeHtml(item.type)} • ${escapeHtml(item.genre)}</small>
          </span>
        </button>
      `
    )
    .join("");
}

function clearSuggestions() {
  renderSuggestions(heroSearchSuggestions, []);
  renderSuggestions(resultsSearchSuggestions, []);
  renderLibrarySuggestions([]);
}

function trapFocusInPreview(event) {
  const focusable = Array.from(
    featurePreviewPanel.querySelectorAll(
      'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
    )
  );
  if (!focusable.length) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey) {
    if (document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

function showHomePreviewShell() {
  if (previewHideTimer) {
    window.clearTimeout(previewHideTimer);
    previewHideTimer = null;
  }

  featurePreviewPanel.hidden = false;
  featurePreviewScrim.hidden = false;
  pageShell.classList.add("preview-open");

  if (prefersReducedMotion.matches) {
    featurePreviewPanel.classList.add("is-visible");
    featurePreviewScrim.classList.add("is-visible");
    return;
  }

  featurePreviewPanel.classList.remove("is-visible");
  featurePreviewScrim.classList.remove("is-visible");

  window.requestAnimationFrame(() => {
    featurePreviewPanel.classList.add("is-visible");
    featurePreviewScrim.classList.add("is-visible");
  });
}

function closeHomePreview() {
  state.homePreviewRequestId += 1;
  state.homePreviewKey = null;
  state.homePreviewDescriptionExpanded = false;
  state.homePreviewProvidersExpanded = false;
  pageShell.classList.remove("preview-open");
  featurePreviewPanel.classList.remove("is-visible");
  featurePreviewScrim.classList.remove("is-visible");
  featurePreviewPanel.removeEventListener("keydown", trapFocusInPreview);

  if (previewDetailWarmTimer) {
    window.clearTimeout(previewDetailWarmTimer);
    previewDetailWarmTimer = null;
  }

  if (previewHoverPrefetchTimer) {
    window.clearTimeout(previewHoverPrefetchTimer);
    previewHoverPrefetchTimer = null;
    previewHoverPrefetchKey = "";
  }

  if (previewTriggerElement && typeof previewTriggerElement.focus === "function") {
    previewTriggerElement.focus({ preventScroll: true });
    previewTriggerElement = null;
  }

  if (previewHideTimer) {
    window.clearTimeout(previewHideTimer);
  }

  const finishClose = () => {
    featurePreviewPanel.hidden = true;
    featurePreviewScrim.hidden = true;
    featurePreviewContent.innerHTML = "";
    previewHideTimer = null;
  };

  if (prefersReducedMotion.matches) {
    finishClose();
  } else {
    previewHideTimer = window.setTimeout(finishClose, 240);
  }

  updateHomeCardSelection();
}

function renderHomePreview(detail) {
  if (!detail) {
    closeHomePreview();
    return;
  }

  showHomePreviewShell();
  featurePreviewPanel.dataset.side = state.homePreviewSide;
  const availabilityInfo = detail.availabilityInfo || fallbackAvailability(detail, detail.mediaType, detail.providers || []);
  const requestUi = getRequestUiState(detail);
  const requestFeedback = requestFeedbackMarkup(requestUi);
  featurePreviewContent.innerHTML = `
    <div class="feature-preview-poster-wrap">
      <img class="feature-preview-poster" src="${escapeHtml(detail.backdrop)}" alt="${escapeHtml(detail.title)} backdrop" />
      <div class="poster-request-overlay">
        ${requestActionButtonMarkup(detail, requestUi)}
      </div>
    </div>
    <div class="feature-preview-meta">
      <p class="meta-kicker">${escapeHtml(detail.genre)} / ${escapeHtml(detail.type)}</p>
      <h3>${escapeHtml(detail.title)}</h3>
      <p class="result-meta compact">${detail.year} • ${escapeHtml(detail.runtime)} • ${escapeHtml(detail.maturity)} • Rated ${escapeHtml(detail.rating)}</p>
      <p class="detail-summary feature-preview-description ${state.homePreviewDescriptionExpanded ? "" : "is-clamped"}">${escapeHtml(detail.overview)}</p>
      ${detail.overview && detail.overview.length > 140 ? `<button class="text-button" type="button" data-toggle-preview-description="true">${state.homePreviewDescriptionExpanded ? "Show less" : "Continue reading"}</button>` : ""}
    </div>
    <div class="meta-row">
      <span class="pill">${escapeHtml(detail.details.director || detail.details.creator || "Unknown creator")}</span>
      <span class="pill">${escapeHtml(detail.details.studio || "Unknown studio")}</span>
      <span class="pill">${escapeHtml(detail.details.status || "Status unknown")}</span>
    </div>
    <div class="feature-preview-section">
      <p class="panel-kicker">${escapeHtml(availabilityInfo.heading)}</p>
      <div class="availability-callout">
        <strong>${escapeHtml(detail.availability)}</strong>
        <p>${escapeHtml(availabilityInfo.message)}</p>
        ${
          availabilityInfo.actionLink
            ? `<div class="feature-preview-actions">
                <a class="action-button" href="${escapeHtml(availabilityInfo.actionLink)}" target="_blank" rel="noreferrer noopener" data-provider-link="true">
                  ${escapeHtml(availabilityInfo.actionLabel)}
                </a>
              </div>`
            : ""
        }
      </div>
      ${
        availabilityInfo.providers.length
          ? `<div class="featured-provider-row">
              ${featuredProviderPills({ ...detail, providers: availabilityInfo.providers }, state.homePreviewProvidersExpanded)}
            </div>`
          : ``
      }
    </div>
    <div class="feature-preview-section request-preview-section">
      ${requestFeedback.message}
      ${requestFeedback.troubleshooting}
    </div>
    ${
      detail.trailer
        ? `<div class="feature-preview-section">
             <p class="panel-kicker">Trailer</p>
             <iframe class="feature-preview-trailer" src="${escapeHtml(detail.trailer)}" title="${escapeHtml(detail.title)} trailer" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
             <p class="feature-preview-note">If this trailer is blocked in-page, <a class="inline-link" href="${escapeHtml(detail.trailerLink)}" target="_blank" rel="noreferrer noopener" data-provider-link="true">open it on YouTube</a>.</p>
           </div>`
        : `<div class="empty-state">Trailer preview is not available for this title.</div>`
    }
    <div class="feature-preview-actions">
      <button class="action-button" type="button" data-open-title-details="${detail.key}">Additional details</button>
    </div>
  `;
}

function navigate(view) {
  const previousView = state.view;
  const leavingHome = previousView === "home" && view !== "home";
  const returningHome = view === "home" && previousView !== "home";

  if (leavingHome) {
    savedHomeScrollY = window.scrollY;
  }

  const resetHomeShelves = view !== "home";
  const resetHomeServiceFilter = resetHomeShelves && state.homeServiceFilter !== "All Services";

  if (resetHomeShelves) {
    state.homeServiceFilter = "All Services";
    state.homeServiceFilterOffset = 0;
    state.featuredMovieOffset = 0;
    state.featuredSeriesOffset = 0;
  }

  state.view = view;

  if (view !== "home") {
    closeHomePreview();
  }

  views.forEach((node) => {
    node.classList.toggle("is-active", node.dataset.view === view);
  });
  navLinks.forEach((link) => {
    const isActive = view === "details"
      ? link.dataset.nav === "home"
      : link.dataset.nav === view;
    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });

  if (resetHomeServiceFilter || view === "home") {
    renderFeatured();
  }

  if (view === "home") {
    document.title = "W.D.I.S. | Where Does it Stream?";
  } else if (view === "library") {
    document.title = "Library | W.D.I.S.";
    void loadLibrary();
  } else if (view === "settings") {
    document.title = "Settings | W.D.I.S.";
    if (!state.settingsLoaded) {
      void loadSettings();
    }
  }

  if (returningHome && savedHomeScrollY > 0) {
    window.scrollTo({ top: savedHomeScrollY, behavior: "instant" });
  } else {
    scrollViewportTop();
  }
}

async function openDetails(key) {
  state.selectedKey = key;
  clearPersonSpotlight();
  navigate("details");
  document.title = "Loading… | W.D.I.S.";
  detailHero.innerHTML = `<div class="detail-hero-content"><p class="eyebrow">Loading</p><h1>Fetching title details...</h1></div>`;
  detailProviders.innerHTML = "";
  detailStats.innerHTML = "";
  detailTrailer.innerHTML = "";
  detailInsights.innerHTML = "";
  castGrid.innerHTML = "";
  crewGrid.innerHTML = "";
  relatedGrid.innerHTML = "";

  try {
    const detail = await fetchDetail(key);
    void getRequestStatus(detail.id, detail.mediaType);
    document.title = `${detail.title} (${detail.year}) | W.D.I.S.`;
    renderDetails(detail);
  } catch (error) {
    document.title = "W.D.I.S. | Where Does it Stream?";
    renderDetails(null);
    castGrid.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    crewGrid.innerHTML = "";
  }
}

async function openHomePreview(key, triggerEl = null) {
  const requestId = state.homePreviewRequestId + 1;
  state.homePreviewRequestId = requestId;
  previewTriggerElement = triggerEl || document.activeElement;
  state.homePreviewKey = key;
  state.homePreviewDescriptionExpanded = false;
  state.homePreviewProvidersExpanded = false;
  state.homePreviewSide = "right";
  showHomePreviewShell();
  featurePreviewPanel.dataset.side = state.homePreviewSide;
  const cachedPreview = previewDetailForKey(key);
  if (cachedPreview) {
    renderHomePreview(cachedPreview);
  } else {
    featurePreviewContent.innerHTML = `<div class="loading-card">Loading preview...</div>`;
  }
  updateHomeCardSelection();
  featurePreviewPanel.addEventListener("keydown", trapFocusInPreview);

  if (previewDetailWarmTimer) {
    window.clearTimeout(previewDetailWarmTimer);
    previewDetailWarmTimer = null;
  }

  try {
    const detail = cachedPreview || await fetchPreviewDetail(key);

    if (requestId !== state.homePreviewRequestId || state.homePreviewKey !== key) {
      return;
    }

    if (!cachedPreview || cachedPreview !== detail) {
      renderHomePreview(detail);
    }

    if (!state.detailCache.has(key)) {
      previewDetailWarmTimer = window.setTimeout(() => {
        if (requestId !== state.homePreviewRequestId || state.homePreviewKey !== key || state.detailCache.has(key)) {
          return;
        }

        void fetchDetail(key)
          .then((fullDetail) => {
            if (requestId === state.homePreviewRequestId && state.homePreviewKey === key) {
              renderHomePreview(fullDetail);
            }
          })
          .catch(() => {});
      }, 240);
    }

    const firstFocusable = featurePreviewPanel.querySelector(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  } catch (error) {
    if (requestId !== state.homePreviewRequestId || state.homePreviewKey !== key) {
      return;
    }

    featurePreviewContent.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

function prefetchHomePreviewDetail(key) {
  if ((state.view !== "home" && state.view !== "library") || !key) {
    return;
  }

  if (state.detailCache.has(key) || state.previewCache.has(key) || previewRequestCache.has(key)) {
    return;
  }

  void fetchPreviewDetail(key).catch(() => {});
}

let _heroSuggestionsController = null;
let _resultsSuggestionsController = null;
let _librarySuggestionsController = null;

const handleHeroSuggestions = debounce(async () => {
  if (_heroSuggestionsController) {
    _heroSuggestionsController.abort();
  }
  _heroSuggestionsController = new AbortController();
  try {
    const suggestions = await fetchSearchSuggestions(heroSearchInput.value, _heroSuggestionsController.signal);
    renderSuggestions(heroSearchSuggestions, suggestions);
  } catch (error) {
    if (error.name !== "AbortError") {
      renderSuggestions(heroSearchSuggestions, []);
    }
  }
});

const handleResultsSuggestions = debounce(async () => {
  if (_resultsSuggestionsController) {
    _resultsSuggestionsController.abort();
  }
  _resultsSuggestionsController = new AbortController();
  try {
    const suggestions = await fetchSearchSuggestions(resultsSearchInput.value, _resultsSuggestionsController.signal);
    renderSuggestions(resultsSearchSuggestions, suggestions);
  } catch (error) {
    if (error.name !== "AbortError") {
      renderSuggestions(resultsSearchSuggestions, []);
    }
  }
});

const handleLibrarySuggestions = debounce(async () => {
  if (_librarySuggestionsController) {
    _librarySuggestionsController.abort();
  }
  _librarySuggestionsController = new AbortController();
  try {
    const suggestions = fetchLibrarySuggestions(librarySearchInput.value);
    renderLibrarySuggestions(suggestions);
  } catch {
    renderLibrarySuggestions([]);
  }
});

async function bootstrapLiveData() {
  void refreshRequestServiceStatus();

  if (!hasToken()) {
    const message = "Streaming data is not configured yet. Open Settings and add your TMDB token.";
    setLoading(featuredMoviesGrid, message);
    setLoading(featuredSeriesGrid, message);
    setLoading(resultsGrid, message);
    renderDetails(null);
    return;
  }

  try {
    await Promise.all([fetchConfiguration(), fetchGenres()]);
    await fetchTrending();
    renderStaticUi();

    // Keep first paint responsive, then deepen shelf coverage in the background.
    void (async () => {
      try {
        state.homeServiceLoading = true;
        await ensureHomeServiceCoverage();
      } catch {
        // non-fatal — keep current featured rows visible
      } finally {
        state.homeServiceLoading = false;
        renderFeatured();
      }

      void preloadHomepageServiceCoverage();
    })();
  } catch (error) {
    setLoading(featuredMoviesGrid, error.message);
    setLoading(featuredSeriesGrid, error.message);
    setLoading(resultsGrid, error.message);
    renderDetails(null);
  }
}

function setSearchBusy(form, busy) {
  const btn = form.querySelector("button[type=submit]");
  if (!btn) {
    return;
  }
  btn.disabled = busy;
  btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
  btn.textContent = busy ? "Searching…" : btn.dataset.originalText;
  form.setAttribute("aria-busy", String(busy));
}

heroSearchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!hasToken()) {
    return;
  }

  setSearchBusy(heroSearchForm, true);
  try {
    await runSearch(heroSearchInput.value);
    clearSuggestions();
    renderStaticUi();
    navigate("home");
    scrollResultsIntoView();
  } catch (error) {
    revealResultsSection("Search results", error.message);
    setLoading(resultsGrid, error.message);
    navigate("home");
    scrollResultsIntoView();
  } finally {
    setSearchBusy(heroSearchForm, false);
  }
});

resultsSearchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setSearchBusy(resultsSearchForm, true);
  try {
    await runSearch(resultsSearchInput.value);
    clearSuggestions();
    renderStaticUi();
  } catch (error) {
    revealResultsSection("Search results", error.message);
    setLoading(resultsGrid, error.message);
  } finally {
    setSearchBusy(resultsSearchForm, false);
  }
});

heroSearchInput.addEventListener("input", () => {
  if (heroSearchInput.value === "" && state.activeSearchContext.mode !== "trending") {
    resetHomepageToTrendingContext({ clearInputs: true });
    fetchTrending().then(() => {
      renderStaticUi();
    }).catch(() => {});
  }
  handleHeroSuggestions();
});

resultsSearchInput.addEventListener("input", () => {
  if (resultsSearchInput.value === "" && state.activeSearchContext.mode !== "trending") {
    resetHomepageToTrendingContext({ clearInputs: true });
    fetchTrending().then(() => {
      renderStaticUi();
    }).catch(() => {});
  }
  handleResultsSuggestions();
});

genreJumpLink?.addEventListener("click", () => {
  scrollFeaturedIntoView();
  emphasizeFeaturedSection();
});

genreChips.addEventListener("click", async (event) => {
  const chip = event.target.closest("[data-genre]");
  if (!chip) {
    return;
  }

  await applyHomepageGenre(chip.dataset.genre);
  renderStaticUi();
  navigate("home");
});

homeServiceFilters.addEventListener("click", async (event) => {
  const chip = event.target.closest("[data-home-service]");
  if (!chip || chip.dataset.homeService === state.homeServiceFilter) {
    return;
  }

  const requestId = state.homeServiceRequestId + 1;
  state.homeServiceRequestId = requestId;
  state.homeServiceFilter = chip.dataset.homeService;
  state.featuredMovieOffset = 0;
  state.featuredSeriesOffset = 0;
  state.homeServiceLoading = true;
  renderFeatured();

  try {
    await ensureHomeServiceCoverage();
  } catch {
    // non-fatal — render whatever was loaded
  } finally {
    state.homeServiceLoading = false;
  }

  if (requestId !== state.homeServiceRequestId) {
    return;
  }

  renderFeatured();
  animateShelf(featuredMoviesGrid, "forward");
  animateShelf(featuredSeriesGrid, "forward");
});

serviceFiltersPrevButton.addEventListener("click", () => {
  state.homeServiceFilterOffset = Math.max(0, state.homeServiceFilterOffset - homeServiceWindow());
  renderFeatured();
  animateShelf(homeServiceFilters, "backward");
});

serviceFiltersNextButton.addEventListener("click", () => {
  const windowSize = homeServiceWindow();
  const maxOffset = Math.max(0, availableHomeServices().length - windowSize);
  state.homeServiceFilterOffset = Math.min(maxOffset, state.homeServiceFilterOffset + windowSize);
  renderFeatured();
  animateShelf(homeServiceFilters, "forward");
});

featuredMoviesPrevButton.addEventListener("click", () => {
  state.featuredMovieOffset = Math.max(0, state.featuredMovieOffset - homeFeaturedWindow());
  renderFeatured();
  animateShelf(featuredMoviesGrid, "backward");
});

featuredSeriesPrevButton.addEventListener("click", () => {
  state.featuredSeriesOffset = Math.max(0, state.featuredSeriesOffset - homeFeaturedWindow());
  renderFeatured();
  animateShelf(featuredSeriesGrid, "backward");
});

featuredMoviesNextButton.addEventListener("click", async () => {
  const featuredWindow = homeFeaturedWindow();
  const nextOffset = state.featuredMovieOffset + featuredWindow;
  const requiredCount = nextOffset + featuredWindow;

  if (state.homeServiceFilter === "All Services") {
    await loadMoreTrendingIfNeeded("Movie", requiredCount);
  } else {
    state.homeServiceLoading = true;
    state.featuredMovieOffset = nextOffset;
    renderFeatured();
    try {
      await ensureHomeServiceCoverage({ focusType: "Movie" });
    } catch {
      // non-fatal — render whatever was loaded
    } finally {
      state.homeServiceLoading = false;
    }
    state.featuredMovieOffset = Math.min(nextOffset, Math.max(0, featuredByType("Movie").length - featuredWindow));
    renderFeatured();
    animateShelf(featuredMoviesGrid, "forward");
    return;
  }

  state.featuredMovieOffset = Math.min(nextOffset, Math.max(0, featuredByType("Movie").length - featuredWindow));
  renderFeatured();
  animateShelf(featuredMoviesGrid, "forward");
});

featuredSeriesNextButton.addEventListener("click", async () => {
  const featuredWindow = homeFeaturedWindow();
  const nextOffset = state.featuredSeriesOffset + featuredWindow;
  const requiredCount = nextOffset + featuredWindow;

  if (state.homeServiceFilter === "All Services") {
    await loadMoreTrendingIfNeeded("Series", requiredCount);
  } else {
    state.homeServiceLoading = true;
    state.featuredSeriesOffset = nextOffset;
    renderFeatured();
    try {
      await ensureHomeServiceCoverage({ focusType: "Series" });
    } catch {
      // non-fatal — render whatever was loaded
    } finally {
      state.homeServiceLoading = false;
    }
    state.featuredSeriesOffset = Math.min(nextOffset, Math.max(0, featuredByType("Series").length - featuredWindow));
    renderFeatured();
    animateShelf(featuredSeriesGrid, "forward");
    return;
  }

  state.featuredSeriesOffset = Math.min(nextOffset, Math.max(0, featuredByType("Series").length - featuredWindow));
  renderFeatured();
  animateShelf(featuredSeriesGrid, "forward");
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
    return;
  }

  const focused = document.activeElement;
  if (!focused) {
    return;
  }

  const inMovieShelf = focused.closest("#featured-movies-grid");
  const inSeriesShelf = focused.closest("#featured-series-grid");

  if (!inMovieShelf && !inSeriesShelf) {
    return;
  }

  event.preventDefault();

  if (inMovieShelf) {
    if (event.key === "ArrowRight") {
      featuredMoviesNextButton.click();
    } else {
      featuredMoviesPrevButton.click();
    }
  } else {
    if (event.key === "ArrowRight") {
      featuredSeriesNextButton.click();
    } else {
      featuredSeriesPrevButton.click();
    }
  }
});

window.addEventListener("resize", debounce(() => {
  state.homeServiceFilterOffset = Math.min(
    state.homeServiceFilterOffset,
    Math.max(0, availableHomeServices().length - homeServiceWindow())
  );
  state.featuredMovieOffset = Math.min(
    state.featuredMovieOffset,
    Math.max(0, featuredByType("Movie").length - homeFeaturedWindow())
  );
  state.featuredSeriesOffset = Math.min(
    state.featuredSeriesOffset,
    Math.max(0, featuredByType("Series").length - homeFeaturedWindow())
  );
  renderFeatured();
}, 120));

resultTypeFilters.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-type]");
  if (!chip) {
    return;
  }

  state.resultsType = chip.dataset.type;
  renderStaticUi();
});

librarySearchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  applyLibrarySearchQuery(librarySearchInput.value);
  renderLibrary();
});

libraryGenreChips.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-library-genre]");
  if (!chip) {
    return;
  }

  state.libraryGenre = chip.dataset.libraryGenre || LIBRARY_ALL_GENRES;
  renderLibrary();
  handleLibrarySuggestions();
});

libraryTypeFilters.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-library-type]");
  if (!chip) {
    return;
  }

  state.libraryType = chip.dataset.libraryType;
  renderLibrary();
  handleLibrarySuggestions();
});

librarySearchInput.addEventListener("input", () => {
  state.libraryQuery = librarySearchInput.value.trim();
  renderLibrary();
  handleLibrarySuggestions();
});

libraryRefreshButton.addEventListener("click", async () => {
  renderLibrarySuggestions([]);
  await loadLibrary();
});

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveSettings();
});

settingsReloadButton.addEventListener("click", async () => {
  await loadSettings();
});

featurePreviewClose.addEventListener("click", () => {
  closeHomePreview();
});

featurePreviewScrim.addEventListener("click", () => {
  closeHomePreview();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.homePreviewKey) {
    closeHomePreview();
  }
});

document.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const card = event.target.closest("[data-library-open]");
  if (!card) {
    return;
  }

  if (event.target.closest("button, a, input, textarea, select")) {
    return;
  }

  event.preventDefault();
  await openLibraryPreview(
    card.dataset.libraryMediaType || "movie",
    card.dataset.libraryId || "",
    card.closest(".media-card")
  );
});

window.addEventListener("scroll", async () => {
  if (state.view !== "home" || state.resultsLoadingMore || !state.resultsHasMore) {
    return;
  }

  if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 900) {
    return;
  }

  await loadMoreResults();
});

document.body.addEventListener("click", async (event) => {
  const navTarget = event.target.closest("[data-nav]");
  const libraryOpenTarget = event.target.closest("[data-library-open]");
  const libraryRemoveTarget = event.target.closest("[data-library-remove]");
  const detailsTarget = event.target.closest("[data-open-details]");
  const titleDetailsTarget = event.target.closest("[data-open-title-details]");
  const personTarget = event.target.closest("[data-open-person]");
  const expandProvidersTarget = event.target.closest("[data-expand-providers]");
  const providerLinkTarget = event.target.closest("[data-provider-link]");
  const requestTarget = event.target.closest("[data-request-title]");
  const suggestionTarget = event.target.closest("[data-suggestion-key]");
  const librarySuggestionTarget = event.target.closest("[data-library-suggestion]");
  const togglePreviewDescriptionTarget = event.target.closest("[data-toggle-preview-description]");
  const loadMoreTarget = event.target.closest("[data-load-more]");

  if (navTarget) {
    clearSuggestions();
    navigate(navTarget.dataset.nav);
    return;
  }

  if (loadMoreTarget) {
    await loadMoreResults();
    return;
  }

  if (providerLinkTarget) {
    return;
  }

  if (libraryRemoveTarget) {
    await removeLibraryItem(
      libraryRemoveTarget.dataset.libraryRemove,
      libraryRemoveTarget.dataset.libraryId,
      libraryRemoveTarget.dataset.libraryTitle || ""
    );
    return;
  }

  if (libraryOpenTarget) {
    await openLibraryPreview(
      libraryOpenTarget.dataset.libraryMediaType || "movie",
      libraryOpenTarget.dataset.libraryId || "",
      libraryOpenTarget.closest(".media-card")
    );
    return;
  }

  if (requestTarget) {
    const itemKey = requestTarget.dataset.requestTitle;
    const requestAction = requestTarget.dataset.requestAction || "add";
    const detail = state.detailCache.get(itemKey) || state.previewCache.get(itemKey) || state.itemCache.get(itemKey);
    if (detail?.id) {
      if (requestAction === "remove") {
        await submitRemoval(detail.id, detail.mediaType, {
          title: detail.title,
          year: detail.year,
        });
      } else {
        await submitRequest(detail.id, detail.mediaType, {
          title: detail.title,
          year: detail.year,
        });
      }
    }
    return;
  }

  if (suggestionTarget) {
    clearSuggestions();
    if (state.view === "home") {
      await openHomePreview(suggestionTarget.dataset.suggestionKey);
    } else {
      await openDetails(suggestionTarget.dataset.suggestionKey);
    }
    return;
  }

  if (librarySuggestionTarget) {
    const query = librarySuggestionTarget.dataset.librarySuggestion || "";
    state.libraryQuery = query;
    librarySearchInput.value = query;
    renderLibrarySuggestions([]);
    renderLibrary();
    return;
  }

  if (personTarget) {
    await openPersonSpotlight(personTarget.dataset.openPerson);
    return;
  }

  if (expandProvidersTarget) {
    if (state.homePreviewKey === expandProvidersTarget.dataset.expandProviders) {
      state.homePreviewProvidersExpanded = true;
      const detail = previewDetailForKey(state.homePreviewKey);
      if (detail) {
        renderHomePreview(detail);
      }
    } else {
      const item = state.itemCache.get(expandProvidersTarget.dataset.expandProviders);
      if (item) {
        item.showAllProviders = true;
        renderFeatured();
      }
    }
    return;
  }

  if (togglePreviewDescriptionTarget) {
    state.homePreviewDescriptionExpanded = !state.homePreviewDescriptionExpanded;
    const detail = previewDetailForKey(state.homePreviewKey);
    if (detail) {
      renderHomePreview(detail);
    }
    return;
  }

  if (titleDetailsTarget) {
    await openDetails(titleDetailsTarget.dataset.openTitleDetails);
    return;
  }

  if (detailsTarget) {
    const featuredCard = event.target.closest(".media-card");
    if (featuredCard && state.view === "home") {
      await openHomePreview(detailsTarget.dataset.openDetails, featuredCard);
      return;
    }

    await openDetails(detailsTarget.dataset.openDetails);
    return;
  }

  if (!event.target.closest(".search-panel")) {
    clearSuggestions();
  }
});

document.body.addEventListener("mouseover", (event) => {
  if (state.view !== "home" && state.view !== "library") {
    return;
  }

  const card = event.target.closest(".media-card[data-open-details]");
  if (!card) {
    return;
  }

  if (event.relatedTarget && card.contains(event.relatedTarget)) {
    return;
  }

  const key = card.dataset.openDetails;
  if (!key || key === previewHoverPrefetchKey) {
    return;
  }

  previewHoverPrefetchKey = key;
  if (previewHoverPrefetchTimer) {
    window.clearTimeout(previewHoverPrefetchTimer);
  }

  previewHoverPrefetchTimer = window.setTimeout(() => {
    previewHoverPrefetchTimer = null;
    prefetchHomePreviewDetail(previewHoverPrefetchKey);
  }, 140);
});

document.body.addEventListener("focusin", (event) => {
  if (state.view !== "home" && state.view !== "library") {
    return;
  }

  const card = event.target.closest(".media-card[data-open-details]");
  if (!card) {
    return;
  }

  if (previewHoverPrefetchTimer) {
    window.clearTimeout(previewHoverPrefetchTimer);
    previewHoverPrefetchTimer = null;
    previewHoverPrefetchKey = "";
  }

  prefetchHomePreviewDetail(card.dataset.openDetails);
});

syncSearchControls();
renderStaticUi();
renderDetails(null);
navigate("home");
bootstrapLiveData();
