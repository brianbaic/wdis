function serviceLabel(serviceName) {
  return serviceName === "sonarr" ? "Sonarr" : "Radarr";
}

function troubleshooting(serviceName) {
  const label = serviceLabel(serviceName);
  return [
    `${label} is intentionally disabled on this public Vercel deployment.`,
    "Use your self-hosted/local deployment for request and library automation.",
  ];
}

function requestServicesSnapshot() {
  return {
    radarr: {
      configured: false,
      connected: false,
      message: "Radarr is local-only and disabled in this public deployment.",
      troubleshooting: troubleshooting("radarr"),
    },
    sonarr: {
      configured: false,
      connected: false,
      message: "Sonarr is local-only and disabled in this public deployment.",
      troubleshooting: troubleshooting("sonarr"),
    },
  };
}

function settingsPayload() {
  return {
    tmdbToken: "",
    radarr: {
      host: "",
      apiKey: "",
      rootFolder: "",
      qualityProfileId: 1,
    },
    sonarr: {
      host: "",
      apiKey: "",
      rootFolder: "",
      qualityProfileId: 1,
    },
  };
}

function localOnlyServicePayload(serviceName, { status = 503 } = {}) {
  return {
    status,
    body: {
      success: false,
      configured: false,
      available: false,
      queue: false,
      service: serviceName,
      code: "local_only_public_deployment",
      message: `${serviceLabel(serviceName)} is disabled in this public deployment.`,
      troubleshooting: troubleshooting(serviceName),
    },
  };
}

module.exports = {
  localOnlyServicePayload,
  requestServicesSnapshot,
  settingsPayload,
};
