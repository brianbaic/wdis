const { requestServicesSnapshot } = require("./_local-only");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, message: "Method not allowed." });
    return;
  }

  res.status(200).json({
    ok: true,
    distReady: true,
    requestServices: requestServicesSnapshot(),
    settingsConfigured: {
      tmdb: Boolean(process.env.TMDB_READ_ACCESS_TOKEN),
      radarr: false,
      sonarr: false,
    },
  });
};
