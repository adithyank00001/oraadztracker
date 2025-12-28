// #region agent log
import { writeFileSync } from 'fs';
import { join } from 'path';
try {
  const logPath = join(process.cwd(), '.cursor', 'debug.log');
  const logEntry = JSON.stringify({
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'B',
    location: 'vite.config.js:1',
    message: 'Vite config loading with Tailwind plugin',
    data: { 
      usingVitePlugin: true,
      timestamp: Date.now()
    },
    timestamp: Date.now()
  }) + '\n';
  writeFileSync(logPath, logEntry, { flag: 'a' });
} catch (e) {}
// #endregion

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
