import { Document, Schema, Model, model, SchemaOptions, Types } from "mongoose";
import { config } from "../../config/v1/config";
import { COLLECTIONS } from "../../utils/v1/constants";
import { addJson, findJsonInJsonArray } from "../../utils/v1/helper";

/**
 * @swagger
 * components:
 *   schemas:
 *     OTP:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *           description: Unique identifier for the OTP record
 *         otp:
 *           type: string
 *           description: The one-time password value
 *         phone:
 *           type: string
 *           description: Phone number the OTP was sent to (optional when using email OTP)
 *           example: "9876543210"
 *         countryCode:
 *           type: string
 *           description: Country code for the phone number (optional when using email OTP)
 *           example: "91"
 *         email:
 *           type: string
 *           description: Email the OTP was sent to (used for forgot password)
 *           example: "user@example.com"
 *         isVerified:
 *           type: boolean
 *           description: Indicates if the OTP was verified
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the OTP was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the OTP was last updated
 */
import { IOtp, IOtpModel } from "../../utils/v1/customTypes";

export const OtpSchema: Schema = new Schema(
  {
    otp: { type: String, required: true },
    phone: { type: String, required: false, trim: true },
    countryCode: { type: String, required: false, trim: true },
    email: { type: String, required: false, trim: true, lowercase: true },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  } as SchemaOptions,
);

OtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });
OtpSchema.set("toObject", { virtuals: true });
OtpSchema.set("toJSON", { virtuals: true });

export const OtpModel: Model<IOtpModel> = model<IOtpModel>(COLLECTIONS.OTP, OtpSchema);

const outcome = findJsonInJsonArray(config.DYNAMIC_MODELS, COLLECTIONS.OTP, "name");

if (!outcome) {
  const obj: Record<string, string | typeof OtpModel> = {};
  addJson(obj, "name", COLLECTIONS.OTP);
  addJson(obj, "model", OtpModel);
  config.DYNAMIC_MODELS.push(obj);
}
