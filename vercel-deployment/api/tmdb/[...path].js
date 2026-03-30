module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({
      status_message: "Method not allowed.",
    });
    return;
  }

  const tmdbToken = process.env.TMDB_READ_ACCESS_TOKEN || "";
  if (!tmdbToken) {
    res.status(500).json({
      status_message: "TMDB token is not configured yet. Add TMDB_READ_ACCESS_TOKEN in Vercel.",
    });
    return;
  }

  const rawPath = req.query?.path;
  const pathSegments = Array.isArray(rawPath)
    ? rawPath
    : rawPath
      ? [rawPath]
      : [];

  const upstreamPath = pathSegments
    .map((segment) => encodeURIComponent(String(segment)))
    .join("/");

  const upstream = new URL(`https://api.themoviedb.org/3/${upstreamPath}`);
  Object.entries(req.query || {}).forEach(([key, value]) => {
    if (key === "path") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => upstream.searchParams.append(key, String(entry)));
      return;
    }

    if (value !== undefined && value !== null && value !== "") {
      upstream.searchParams.set(key, String(value));
    }
  });

  try {
    const upstreamResponse = await fetch(upstream.toString(), {
      headers: {
        Authorization: `Bearer ${tmdbToken}`,
        Accept: "application/json",
      },
    });

    const buffer = Buffer.from(await upstreamResponse.arrayBuffer());
    const contentType = upstreamResponse.headers.get("content-type");

    res.status(upstreamResponse.status);
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    if (upstreamResponse.status === 429) {
      const retryAfter = upstreamResponse.headers.get("Retry-After");
      if (retryAfter) {
        res.setHeader("Retry-After", retryAfter);
      }
      res.setHeader("Cache-Control", "no-store");
    } else {
      res.setHeader("Cache-Control", upstreamResponse.ok ? "public, max-age=60" : "no-store");
    }

    res.send(buffer);
  } catch (error) {
    res.status(502).json({
      status_message: "The streaming data service is unavailable right now.",
      detail: error.message,
    });
  }
};
