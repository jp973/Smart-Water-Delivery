import mongoose, { Document, Schema, Model, model, SchemaOptions, FilterQuery, Types } from "mongoose";
import { addJson, findJsonInJsonArray } from "../../utils/v1/helper";
import { config } from "../../config/v1/config";
import { COLLECTIONS, USER_ROLES } from "../../utils/v1/constants";

export const TOKEN_EXPIRY: number = Number(config.ACCESS_TOKEN_EXPIRY);

/**
 * @swagger
 * components:
 *  schemas:
 *    Access Token:
 *      type: object
 *      properties:
 *        _id:
 *          type: string
 *          format: objectId
 *          description: Unique identifier for the token record
 *          example: "64b7c67b2f4a3e8d9c1a01f1"
 *        token:
 *          type: string
 *          description: The actual token value
 *          example: "abcdef1234567890"
 *        userId:
 *          type: string
 *          format: objectId
 *          description: The user ID associated with the token
 *          example: "64b7c67b2f4a3e8d9c1a01f2"
 *        isDemo:
 *          type: boolean
 *          description: Indicates whether the token record is part of a demo
 *          example: false
 *        createdAt:
 *          type: string
 *          format: date-time
 *          description: The date and time when the token was created
 *          example: "2024-12-01T10:15:30Z"
 *        updatedAt:
 *          type: string
 *          format: date-time
 *          description: The date and time when the token was updated
 *          example: "2024-12-01T10:15:30Z"
 */

import { IAccessToken, IAccessTokenModel } from "../../utils/v1/customTypes";

export const AccessTokenSchema: Schema = new Schema(
  {
    token: {
      type: String,
      index: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
    role: { type: String, enum: Object.values(USER_ROLES), required: true },
  },
  {
    usePushEach: true,
    bufferCommands: true,
    versionKey: false,
  } as SchemaOptions,
);
// Create a compound unique index on countryCode and phone
AccessTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: TOKEN_EXPIRY * 60 });

export const AccessTokenModel: Model<IAccessTokenModel> = model<IAccessTokenModel>(
  COLLECTIONS.ACCESS_TOKEN,
  AccessTokenSchema,
);

const outcome = findJsonInJsonArray(config.DYNAMIC_MODELS, COLLECTIONS.ACCESS_TOKEN, "name");

if (!outcome) {
  const obj = {
    name: COLLECTIONS.ACCESS_TOKEN,
    model: AccessTokenModel,
  };

  addJson(obj, "name", COLLECTIONS.ACCESS_TOKEN);
  addJson(obj, "model", AccessTokenModel);
  config.DYNAMIC_MODELS.push(obj);
}

export const findByToken = async function (token: string): Promise<IAccessToken | null> {
  try {
    const result = await AccessTokenModel.findOne({ token });
    return result ? (result.toObject() as IAccessToken) : null;
  } catch (error) {
    throw error;
  }
};

export const findByUserId = function (userId: string, cb: Function): void {
  AccessTokenModel.find({ userId: userId }, {}, {})
    .then(result => {
      cb(null, result);
    })
    .catch(function (error) {
      cb(error, null);
    });
};

export const deleteToken = (userId: Types.ObjectId): Promise<void> => {
  return new Promise((resolve, reject) => {
    AccessTokenModel.deleteMany({ userId }, {})
      .then(() => resolve()) // Resolve with no result, just indicate completion
      .catch(error => reject(new Error(`Failed to delete access token: ${error.message}`))); // Reject with an error message
  });
};

export const deleteSingleToken = function (query: FilterQuery<Document>, cb: Function): void {
  AccessTokenModel.deleteOne(query, {})
    .then(result => {
      cb(null, result);
    })
    .catch(function (error) {
      cb(error, null);
    });
};

// Function to create access token with expiry of 1 hour
export const createAccessToken = async (
  userId: Types.ObjectId,
  access_token: string,
  role: string = "user",
): Promise<void> => {
  const tokenObj = new AccessTokenModel({
    token: access_token,
    userId: userId,
    role: role,
  });

  await tokenObj.save();
};
