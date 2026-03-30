const { localOnlyServicePayload } = require("../_local-only");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ success: false, message: "Method not allowed." });
    return;
  }

  const type = String(req.query?.type || "").toLowerCase();
  if (type !== "movie" && type !== "tv") {
    res.status(400).json({
      requested: false,
      code: "validation_error",
      message: "type must be either movie or tv.",
    });
    return;
  }

  const payload = localOnlyServicePayload(type === "tv" ? "sonarr" : "radarr", { status: 200 });
  res.status(200).json({
    requested: false,
    ...payload.body,
  });
};
