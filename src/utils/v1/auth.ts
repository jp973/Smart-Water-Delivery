// src/utils/auth.ts
import jwt from "jsonwebtoken";
import { config } from "../../config/v1/config";
import { logger } from "./logger";

export interface TokenPayload {
  userId: string;
  email: string;
  role: "Admin" | "User";
}

export const generateAccessToken = (payload: TokenPayload): string => {
  // Convert minutes to seconds (JWT expects number in seconds or string like "10m")
  // Config value is in minutes, so multiply by 60 to get seconds
  const expiresInSeconds = config.ACCESS_TOKEN_EXPIRY * 60;
  
  return jwt.sign(payload, config.JWT_SECRET_KEY, {
    expiresIn: expiresInSeconds,
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  // Convert minutes to seconds (JWT expects number in seconds or string like "10m")
  // Config value is in minutes, so multiply by 60 to get seconds
  const expiresInSeconds = config.REFRESH_TOKEN_EXPIRY * 60;
  
  return jwt.sign(payload, config.JWT_SECRET_KEY, {
    expiresIn: expiresInSeconds,
  });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, config.JWT_SECRET_KEY) as TokenPayload;
  } catch (err) {
    logger.error("Token verification failed:"+ err);
    return null;
  }
};