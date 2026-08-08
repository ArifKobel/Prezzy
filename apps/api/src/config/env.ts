import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

const appRoot = resolve(__dirname, "..", "..");
const envPath = resolve(appRoot, ".env");

config({ path: existsSync(envPath) ? envPath : undefined });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

const port = Number(process.env.PORT ?? 3001);

export const env = {
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  port,
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  publicUrl: process.env.PUBLIC_URL ?? `http://localhost:${port}`,
};
