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
 *         phone:
 *           type: string
 *           description: Phone number of the admin
 *           example: "9876543210"
 *         countryCode:
 *           type: string
 *           description: Country code for the phone number
 *           example: "91"
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
    phone: { type: String, required: true, trim: true },
    countryCode: { type: String, required: true, trim: true },
    name: { type: String, required: false, trim: true, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  } as SchemaOptions,
);

AdminSchema.index({ countryCode: 1, phone: 1 }, { unique: true });
AdminSchema.set("toObject", { virtuals: true });
AdminSchema.set("toJSON", { virtuals: true });

export const AdminModel: Model<IAdminModel> = model<IAdminModel>(COLLECTIONS.ADMIN, AdminSchema);

const outcome = findJsonInJsonArray(config.DYNAMIC_MODELS, COLLECTIONS.ADMIN, "name");

if (!outcome) {
  const obj: Record<string, string | typeof AdminModel> = {};
  addJson(obj, "name", COLLECTIONS.ADMIN);
  addJson(obj, "model", AdminModel);
  config.DYNAMIC_MODELS.push(obj);
}

