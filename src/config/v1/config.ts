import * as dotenv from "dotenv";
import { resolve } from "path";

// Load .env only if it exists (local development)
dotenv.config({ path: resolve(process.cwd(), ".env") });

// Import config.json directly so the bundler includes it
let configFileJSON: any = {};
try {
  configFileJSON = require("../../../config.json");
} catch (err) {
  console.warn("config.json not found, relying on environment variables.");
}

interface Config {
  DYNAMIC_MODELS: { [key: string]: string | object }[];
  PORT: number;
  MONGODB_URI: string;
  DEMO_MONGODB_URI: string;
  SWAGGER_URLS: string;
  ENVIRONMENT: string;
  ACCESS_TOKEN_EXPIRY: number;
  REFRESH_TOKEN_EXPIRY: number;
  JWT_SECRET_KEY: string;
  OTP_EXPIRY: number;
  STORAGE_SERVICE: string;
  S3_REGION: string;
  S3_BUCKET: string;
  SIGNEDURL_EXPIRY: number;
  SEED: {
    SUPER_ADMIN: {
      NAME: string;
      EMAIL: string;
      PASSWORD: string;
    };
  };
}

function getEnvVariable(key: string, mandatory = true, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && mandatory) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Environment variable ${key} is missing.`);
  }
  return (value || defaultValue) as string;
}

function getConfigVariable(key: string, mandatory = true, defaultValue?: string): string {
  const env = process.env.ENVIRONMENT || "development";
  const envConfig = configFileJSON[env] || {};

  // Handle nested property access using dot notation
  const keys = key.split('.');
  let value: unknown = envConfig;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[k];
    } else {
      value = undefined;
      break;
    }
  }

  if (value === undefined && mandatory) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Config variable ${key} is missing in ${env} environment.`);
  }
  return (value !== undefined ? String(value) : defaultValue) as string;
}

export const config: Config = {
  DYNAMIC_MODELS: [],
  ENVIRONMENT: getEnvVariable("ENVIRONMENT", false, "development"),
  MONGODB_URI: getEnvVariable("MONGODB_URI", true),
  DEMO_MONGODB_URI: getEnvVariable("DEMO_MONGODB_URI", false),
  PORT: Number(getEnvVariable("PORT", false)) || Number(getConfigVariable("PORT", false, "7002")),
  SWAGGER_URLS: getEnvVariable("SWAGGER_URLS", false) || getConfigVariable("SWAGGER_URLS", false, ""),
  ACCESS_TOKEN_EXPIRY: Number(getEnvVariable("ACCESS_TOKEN_EXPIRY", false)) || Number(getConfigVariable("ACCESS_TOKEN_EXPIRY", false, "43200")),
  REFRESH_TOKEN_EXPIRY: Number(getEnvVariable("REFRESH_TOKEN_EXPIRY", false)) || Number(getConfigVariable("REFRESH_TOKEN_EXPIRY", false, "5256000")),
  JWT_SECRET_KEY: getEnvVariable("JWT_SECRET_KEY", true),
  OTP_EXPIRY: Number(getEnvVariable("OTP_EXPIRY", false, "10")),
  STORAGE_SERVICE: getEnvVariable("STORAGE_SERVICE", false) || getConfigVariable("STORAGE_SERVICE", false, "S3"),
  S3_REGION: getEnvVariable("S3_REGION", false) || getConfigVariable("S3_REGION", false, "ap-south-1"),
  S3_BUCKET: getEnvVariable("S3_BUCKET", false) || getConfigVariable("S3_BUCKET", false, ""),
  SIGNEDURL_EXPIRY: Number(getEnvVariable("SIGNEDURL_EXPIRY", false)) || Number(getConfigVariable("SIGNEDURL_EXPIRY", false, "10")),
  SEED: {
    SUPER_ADMIN: {
      NAME: getConfigVariable("SEED.SUPER_ADMIN.NAME", false, "SUPER ADMIN"),
      EMAIL: getConfigVariable("SEED.SUPER_ADMIN.EMAIL", false, "admin@gmail.com"),
      PASSWORD: getConfigVariable("SEED.SUPER_ADMIN.PASSWORD", false, "Admin@123"),
    },
  },
}
