import { Document, Schema, Model, model, SchemaOptions, Types } from "mongoose";
import { COLLECTIONS } from "../../utils/v1/constants";
import { config } from "../../config/v1/config";
import { addJson, findJsonInJsonArray } from "../../utils/v1/helper";

/**
 * @swagger
 * components:
 *   schemas:
 *     Admin:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *           description: Unique identifier for the admin
 *         name:
 *           type: string
 *           description: Name of the admin
 *           example: "Admin User"
 *         email:
 *           type: string
 *           description: Email of the admin
 *           example: "admin@example.com"
 *         password:
 *           type: string
 *           description: Hashed password of the admin (never returned in responses)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the admin was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the admin was last updated
 */

import { IAdmin, IAdminModel } from "../../utils/v1/customTypes";

export const AdminSchema: Schema = new Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, required: false, trim: true, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  } as SchemaOptions,
);

AdminSchema.set("toObject", { virtuals: true });
AdminSchema.set("toJSON", { virtuals: true });
AdminSchema.index({ _id: 1, email: 1 }, { unique: true });

export const AdminModel: Model<IAdminModel> = model<IAdminModel>(COLLECTIONS.ADMIN, AdminSchema);

const outcome = findJsonInJsonArray(config.DYNAMIC_MODELS, COLLECTIONS.ADMIN, "name");

if (!outcome) {
  const obj: Record<string, string | typeof AdminModel> = {};
  addJson(obj, "name", COLLECTIONS.ADMIN);
  addJson(obj, "model", AdminModel);
  config.DYNAMIC_MODELS.push(obj);
}

