# W.D.I.S.

W.D.I.S. stands for Where Does it Stream?

It is a React + Vite app with an Express runtime that helps you find where a movie or TV title is available to stream, watch with ads, rent, or buy.

## Stack

- React 18
- Vite 6
- Express 4
- TMDB API (server-side proxy)

## Local Development

1. Install dependencies.
2. Start the dev server.

```bash
npm install
npm run dev
```

Open http://localhost:5173 (or the port shown by Vite).

## Production-style Local Run

```bash
npm run build
npm run serve
```

## Environment Variables

Copy values from .env.example into a local .env file.

Required for live TMDB lookups:

- TMDB_READ_ACCESS_TOKEN

Optional app/runtime values include:

- PORT
- VITE_TMDB_API_BASE
- VITE_TMDB_LANGUAGE
- VITE_TMDB_REGION

## Vercel Deployment Package

This repository includes a deployment-ready folder at vercel-deployment.

To sync current frontend assets into that folder:

```bash
npm run build
```

The build script also runs the Vercel sync script.

For Vercel setup:

1. Create a Vercel project.
2. Set the project root to vercel-deployment.
3. Add environment variable TMDB_READ_ACCESS_TOKEN.
4. Deploy.

## Repository Hygiene

Files that should never be committed are already covered in .gitignore, including:

- node_modules
- local .env files
- logs
- local tool folders

For safe commits:

1. Check status first with git status.
2. Review staged changes with git diff --staged.
3. Commit only intentional project files.
