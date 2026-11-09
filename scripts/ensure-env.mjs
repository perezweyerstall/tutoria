import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env');
const envLocalPath = path.join(root, '.env.local');
const examplePath = path.join(root, '.env.example');

if (fs.existsSync(examplePath)) {
  try {
    if (!fs.existsSync(envPath)) {
      fs.copyFileSync(examplePath, envPath);
      console.log('[tutoria] Se creó el archivo .env local a partir de .env.example');
    } else {
      // Verify readability; if sandbox-mounted as unreadable, fall back to .env.local
      fs.accessSync(envPath, fs.constants.R_OK);
    }
  } catch {
    if (!fs.existsSync(envLocalPath)) {
      try {
        fs.copyFileSync(examplePath, envLocalPath);
        console.log('[tutoria] Se creó el archivo .env.local a partir de .env.example');
      } catch {
        // Proceed with built-in defaults
      }
    }
  }
}

try {
  const dataDir = path.join(root, 'data', 'backups');
  fs.mkdirSync(dataDir, { recursive: true });
} catch {
  // Ignored in read-only environments
}
