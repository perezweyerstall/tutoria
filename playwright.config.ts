import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from '@playwright/test';

const systemChromiumCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
].filter((p): p is string => Boolean(p && fs.existsSync(p)));

const e2eDataDir = path.resolve(__dirname, 'data', 'e2e');
const e2eDbPath = path.join(e2eDataDir, 'e2e-principia.db');
const e2eBackupDir = path.join(e2eDataDir, 'backups');

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:3105',
    headless: true,
    launchOptions: systemChromiumCandidates[0]
      ? {
          executablePath: systemChromiumCandidates[0],
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }
      : undefined,
  },
  webServer: {
    command: 'npx next start -p 3105 -H 127.0.0.1',
    url: 'http://127.0.0.1:3105',
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      DATABASE_URL: e2eDbPath,
      BACKUP_DIR: e2eBackupDir,
      OPTIONAL_AI_API_KEY: '',
      OPTIONAL_AI_BASE_URL: '',
    },
  },
});
