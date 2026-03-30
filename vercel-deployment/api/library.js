module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ success: false, message: "Method not allowed." });
    return;
  }

  res.status(200).json({
    success: true,
    movies: [],
    series: [],
    services: {
      radarr: {
        available: false,
        message: "Radarr is local-only and disabled in this public deployment.",
      },
      sonarr: {
        available: false,
        message: "Sonarr is local-only and disabled in this public deployment.",
      },
    },
  });
};
