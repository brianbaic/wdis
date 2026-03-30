# W.D.I.S. Vercel Deployment Package

This folder is a Vercel-ready public deployment package for W.D.I.S.

## What is included
- Static app build (`index.html` + `assets/`)
- Serverless TMDB proxy: `api/tmdb/[...path].js`
- Public-safe stubs for local-only routes:
  - `api/settings`
  - `api/library`
  - `api/request/*`
  - `api/health`

## Why this is public-safe
- TMDB token is read only on the server via `TMDB_READ_ACCESS_TOKEN`.
- Radarr/Sonarr endpoints are intentionally disabled for public deployment.
- No Radarr/Sonarr host/API-key values are required here.

## Required Vercel env var
- `TMDB_READ_ACCESS_TOKEN` (set this in Vercel Project Settings -> Environment Variables)

## Sync static files after app updates
From project root:

```bash
npm run build
npm run sync:vercel
```

## Deploy
Deploy this `vercel-deployment` folder as its own Vercel project root.
