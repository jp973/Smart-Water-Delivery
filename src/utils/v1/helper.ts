import { z } from "zod";
import mongoose from "mongoose";
import uniqid from "uniqid";


export function generateTransactionId(): string {
  return uniqid("tx");
}

export function getObjectIdFromDate(date: Date): string {
  const objectId = Math.floor(date.getTime() / 1000).toString(16) + "0000000000000000";
  return objectId;
}

export function getDateFromObjectId(objectId: string): Date {
  const timestamp = parseInt(objectId.substring(0, 8), 16) * 1000;
  return new Date(timestamp);
}

export function isDateValid(date: Date | null | undefined): boolean {
  return date instanceof Date && !isNaN(date.valueOf());
}

export function toObjectId(id: string | mongoose.Types.ObjectId | unknown): mongoose.Types.ObjectId {
  if (id instanceof mongoose.Types.ObjectId) {
    return id;
  }
  if (typeof id === "string") {
    return new mongoose.Types.ObjectId(id);
  }
  try {
    return new mongoose.Types.ObjectId(String(id));
  } catch (error) {
    console.error("Error converting to ObjectId:", error);
    throw new Error("Invalid ObjectId input");
  }
}

export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit numeric
}
export const getAllSchema = z.object({
  body: z.object({
    projection: z.record(z.string(), z.any()).optional(),
    options: z.object({
      page: z.number().int().min(1).optional(),
      itemsPerPage: z.number().int().min(1).optional(),
      sortBy: z.array(z.string()).optional(),
      sortDesc: z.array(z.boolean()).optional(),
    }).optional(),
    search: z.array(z.object({
      term: z.string().optional(),
      fields: z.array(z.string()).optional(),
      startsWith: z.boolean().optional(),
      endsWith: z.boolean().optional(),
    })).optional(),
    filter: z.record(z.string(), z.any()).optional(),
  }).optional()
});

export function findJsonInJsonArray<T>(list: { [key: string]: T }[], value: T, keyToSearch: string): boolean {
  for (const element of list) {
    if (element[keyToSearch] === value) {
      return true;
    }
  }
  return false;
}

export function addJson<T>(obj: Record<string, T>, key: string, value: T): Record<string, T> {
  obj[key] = value;
  return obj;
}



