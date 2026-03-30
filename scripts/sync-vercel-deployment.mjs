import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const sourceDistDir = path.join(rootDir, "dist");
const targetDir = path.join(rootDir, "vercel-deployment");
const targetAssetsDir = path.join(targetDir, "assets");
const targetIndexPath = path.join(targetDir, "index.html");

function ensurePathExists(targetPath, message) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(message);
  }
}

function ensureDirectory(targetPath) {
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
}

ensurePathExists(sourceDistDir, "Build output missing. Run `npm run build` before syncing Vercel assets.");
ensureDirectory(targetDir);

if (fs.existsSync(targetAssetsDir)) {
  fs.rmSync(targetAssetsDir, { recursive: true, force: true });
}

if (fs.existsSync(targetIndexPath)) {
  fs.rmSync(targetIndexPath, { force: true });
}

for (const entry of fs.readdirSync(sourceDistDir)) {
  fs.cpSync(path.join(sourceDistDir, entry), path.join(targetDir, entry), {
    recursive: true,
    force: true,
  });
}

console.log("Synced vercel-deployment static assets from dist.");
