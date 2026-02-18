import {  Schema, Model, model, SchemaOptions, Types } from "mongoose";
import { config } from "../../config/v1/config";
import { USER_ROLES, COLLECTIONS } from "../../utils/v1/constants";
import { addJson, findJsonInJsonArray } from "../../utils/v1/helper";

export const TOKEN_EXPIRY: number = config.REFRESH_TOKEN_EXPIRY; // 30 days In Minutes

/**
 * @swagger
 * components:
 *  schemas:
 *    Refresh Token:
 *      type: object
 *      properties:
 *        _id:
 *          type: string
 *          format: objectId
 *          description: Unique identifier for the token record
 *        token:
 *          type: string
 *          description: The actual token value
 *        userId:
 *          type: string
 *          format: objectId
 *          description: The user ID associated with the token
 *        createdAt:
 *          type: string
 *          format: date-time
 *          description: The date and time when the token was created
 *        updatedAt:
 *          type: string
 *          format: date-time
 *          description: The date and time when the token was updated
 *        role:
 *          type: string
 *          description: The role of the user (user or admin)
 *          enum: [user, admin]
 */
import { IRefreshToken, IRefreshTokenModel } from "../../utils/v1/customTypes";

const USER_ROLES_VALUES: string[] = [
  // USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.USER,
];

// TypeScript has a known limitation with complex union type inference in mongoose Schema definitions
export const RefreshTokenSchema: Schema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    role: {
      type: String,
      enum: USER_ROLES_VALUES,
      required: true,
    },
  },
  {
    timestamps: true,
    usePushEach: true,
    bufferCommands: true,
    versionKey: false,
  } as SchemaOptions,
);

RefreshTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: TOKEN_EXPIRY * 60 });
RefreshTokenSchema.set("toObject", { virtuals: true });
RefreshTokenSchema.set("toJSON", { virtuals: true });

export const RefreshTokenModel: Model<IRefreshTokenModel> = model<IRefreshTokenModel>(
  COLLECTIONS.REFRESH_TOKEN,
  RefreshTokenSchema,
);

const outcome = findJsonInJsonArray(config.DYNAMIC_MODELS, COLLECTIONS.REFRESH_TOKEN, "name");

if (!outcome) {
  const obj = {
    name: COLLECTIONS.REFRESH_TOKEN,
    model: RefreshTokenModel,
  };

  addJson(obj, "name", COLLECTIONS.REFRESH_TOKEN);
  addJson(obj, "model", RefreshTokenModel);
  config.DYNAMIC_MODELS.push(obj);
}

// Function to create refresh token
export const createRefreshToken = async (
  userId: Types.ObjectId,
  refresh_token: string,
  role: string = "user",
): Promise<void> => {
  const tokenObj = new RefreshTokenModel({
    token: refresh_token,
    userId: userId,
    role: role,
  });

  await tokenObj.save();
};
