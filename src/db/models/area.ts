import { Document, Schema, Model, model, SchemaOptions, Types } from "mongoose";
import { COLLECTIONS } from "../../utils/v1/constants";
import { config } from "../../config/v1/config";
import { addJson, findJsonInJsonArray } from "../../utils/v1/helper";

/**
 * @swagger
 * components:
 *   schemas:
 *     Area:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *           description: Unique identifier for the area
 *         name:
 *           type: string
 *           description: Name of the area
 *           example: "North Sector"
 *         description:
 *           type: string
 *           description: Detailed description of the area
 *           example: "Covers the northern residential district"
 *         city:
 *           type: string
 *           description: City name for the area
 *           example: "Ahmedabad"
 *         pincode:
 *           type: string
 *           description: Postal/ZIP code for the area
 *           example: "380015"
 *         isDeleted:
 *           type: boolean
 *           description: Flag for soft deletion
 *           default: false
 *         totalCustomer:
 *           type: number
 *           description: Total number of customers in this area
 *           example: 5
 *         totalLiters:
 *           type: number
 *           description: Total water quantity (liters) for all customers in this area
 *           example: 200
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the area was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the area was last updated
 */

import { IAreaModel } from "../../utils/v1/customTypes";

export const AreaSchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, required: false, trim: true, default: "" },
        city: { type: String, required: true, trim: true },
        pincode: { type: String, required: true, trim: true, match: /^\d{6}$/ },
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        versionKey: false,
        id: false,
    } as SchemaOptions,
);

AreaSchema.set("toObject", { virtuals: true });
AreaSchema.set("toJSON", { virtuals: true });

export const AreaModel: Model<IAreaModel> = model<IAreaModel>(COLLECTIONS.AREA, AreaSchema);

const outcome = findJsonInJsonArray(config.DYNAMIC_MODELS, COLLECTIONS.AREA, "name");

if (!outcome) {
    const obj: Record<string, string | typeof AreaModel> = {};
    addJson(obj, "name", COLLECTIONS.AREA);
    addJson(obj, "model", AreaModel);
    config.DYNAMIC_MODELS.push(obj);
}
