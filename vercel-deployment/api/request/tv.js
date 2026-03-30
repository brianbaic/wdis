const { localOnlyServicePayload } = require("../_local-only");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Method not allowed." });
    return;
  }

  const payload = localOnlyServicePayload("sonarr");
  res.status(payload.status).json(payload.body);
};
