import * as dotenv from "dotenv";
import { readFileSync } from "fs";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });

const configFilePath = resolve(process.cwd(), "config.json");
const configFileData = readFileSync(configFilePath, "utf8");
const configFileJSON = JSON.parse(configFileData);

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
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  SIGNEDURL_EXPIRY: number;
  MESSAGE_SERVICE: string;
  WHATSAPP_API_URL: string;
  WHATSAPP_AUTH_TOKEN: string;
  SEED: {
    SUPER_ADMIN: {
      NAME: string;
      EMAIL: string;
      PASSWORD: string;
    };
  };
}

function getEnvVariable(key: string, mandatory = true): string {
  const value = process.env[key];
  if (!value && mandatory) {
    throw new Error(`Environment variable ${key} is missing.`);
  }
  return value as string;
}

function getConfigVariable(key: string, mandatory = true): string {
  const config = configFileJSON;
  const envConfig = config[process.env.ENVIRONMENT];

  // Handle nested property access using dot notation
  const keys = key.split('.');
  let value: any = envConfig;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      value = undefined;
      break;
    }
  }

  if (!value && mandatory) {
    throw new Error(`Config variable ${key} is missing.`);
  }
  return value as string;
}

export const config: Config = {
  DYNAMIC_MODELS: [],
  MONGODB_URI: getEnvVariable("MONGODB_URI", true),
  DEMO_MONGODB_URI: getEnvVariable("DEMO_MONGODB_URI", false),
  PORT: Number(getEnvVariable("PORT", false)) || Number(getConfigVariable("PORT", true)),
  SWAGGER_URLS: getConfigVariable("SWAGGER_URLS", true),
  ENVIRONMENT: getEnvVariable("ENVIRONMENT", true),
  ACCESS_TOKEN_EXPIRY: Number(getEnvVariable("ACCESS_TOKEN_EXPIRY", false)) || Number(getConfigVariable("ACCESS_TOKEN_EXPIRY", true)),
  REFRESH_TOKEN_EXPIRY: Number(getEnvVariable("REFRESH_TOKEN_EXPIRY", false)) || Number(getConfigVariable("REFRESH_TOKEN_EXPIRY", true)),
  JWT_SECRET_KEY: getEnvVariable("JWT_SECRET_KEY", true),
  OTP_EXPIRY: Number(getEnvVariable("OTP_EXPIRY", true)),
  STORAGE_SERVICE: getConfigVariable("STORAGE_SERVICE", true),
  S3_REGION: getConfigVariable("S3_REGION", true),
  S3_BUCKET: getConfigVariable("S3_BUCKET", true),
  AWS_ACCESS_KEY_ID: getEnvVariable("AWS_ACCESS_KEY_ID", true),
  AWS_SECRET_ACCESS_KEY: getEnvVariable("AWS_SECRET_ACCESS_KEY", true),
  SIGNEDURL_EXPIRY: Number(getEnvVariable("SIGNEDURL_EXPIRY", false)) || Number(getConfigVariable("SIGNEDURL_EXPIRY", true)),
  MESSAGE_SERVICE: getEnvVariable("MESSAGE_SERVICE", true),
  WHATSAPP_API_URL: getEnvVariable("WHATSAPP_API_URL", true),
  WHATSAPP_AUTH_TOKEN: getEnvVariable("WHATSAPP_AUTH_TOKEN", true),
  SEED: {
    SUPER_ADMIN: {
      NAME: getConfigVariable("SEED.SUPER_ADMIN.NAME", false) || "SUPER ADMIN",
      EMAIL: getConfigVariable("SEED.SUPER_ADMIN.EMAIL", true),
      PASSWORD: getConfigVariable("SEED.SUPER_ADMIN.PASSWORD", true),
    },
  },
}