import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const versionInfo = {
  version: process.env.VITE_APP_VERSION || packageJson.version || '0.0.0',
  buildTime: new Date().toISOString(),
};

const publicPath = path.resolve(__dirname, '../public/version.json');
fs.writeFileSync(publicPath, JSON.stringify(versionInfo, null, 2));

console.log('Version info generated:', versionInfo);
