import type { NextConfig } from 'next';
import * as path from 'path';
import * as fs from 'fs';

// Load root .env into process.env on server startup
const rootEnvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(rootEnvPath)) {
  const envConfig = fs.readFileSync(rootEnvPath, 'utf-8');
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const firstEq = trimmed.indexOf('=');
      const key = trimmed.slice(0, firstEq).trim();
      let value = trimmed.slice(firstEq + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

const nextConfig: NextConfig = {
  // Only public variables inlined into the browser bundle; server secrets stay in process.env
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
    NEXT_PUBLIC_AI_URL:
      process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8080/api/v1/ai',
  },
};

export default nextConfig;
