const { requestServicesSnapshot, settingsPayload } = require("./_local-only");

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    res.status(200).json({
      success: true,
      settings: settingsPayload(),
      requestServices: requestServicesSnapshot(),
    });
    return;
  }

  if (req.method === "PUT") {
    res.status(403).json({
      success: false,
      code: "read_only_public_deployment",
      message: "Settings are read-only in this public deployment.",
      requestServices: requestServicesSnapshot(),
    });
    return;
  }

  res.status(405).json({ success: false, message: "Method not allowed." });
};
