import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.resolve(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

let gitHash = "unknown";
try {
  gitHash = execSync("git rev-parse --short HEAD").toString().trim();
} catch (e) {
  console.warn("Could not get git hash, defaulting to unknown");
}

const now = new Date();
const formattedDate =
  now.getFullYear().toString() +
  (now.getMonth() + 1).toString().padStart(2, "0") +
  now.getDate().toString().padStart(2, "0") +
  "-" +
  now.getHours().toString().padStart(2, "0") +
  now.getMinutes().toString().padStart(2, "0");

const versionInfo = {
  version:
    process.env.VITE_APP_VERSION && process.env.VITE_APP_VERSION !== "dev"
      ? process.env.VITE_APP_VERSION
      : formattedDate,
  gitHash,
  buildTime: now.toISOString(),
};

const publicPath = path.resolve(__dirname, "../public/version.json");
fs.writeFileSync(publicPath, JSON.stringify(versionInfo, null, 2));

// Also write to .env.production to inject it into the Vite build bundle
const envPath = path.resolve(__dirname, "../.env.production");
fs.writeFileSync(envPath, `VITE_APP_VERSION=${versionInfo.version}\n`);

console.log("Version info generated:", versionInfo);
