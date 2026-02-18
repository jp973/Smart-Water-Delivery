import { Schema, Model, model, SchemaOptions } from "mongoose";
import { COLLECTIONS, SLOT_STATUS } from "../../utils/v1/constants";
import { config } from "../../config/v1/config";
import { addJson, findJsonInJsonArray } from "../../utils/v1/helper";

/**
 * @swagger
 * components:
 *   schemas:
 *     Slot:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *           description: Unique identifier for the slot
 *         date:
 *           type: string
 *           format: date
 *           description: Date of the slot
 *           example: "2024-03-20"
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: Start time of the slot
 *           example: "2024-03-20T10:00:00.000Z"
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: End time of the slot
 *           example: "2024-03-20T11:00:00.000Z"
 *         areaId:
 *           type: string
 *           format: objectId
 *           description: Reference to the Area
 *         capacity:
 *           type: number
 *           description: Total capacity of the slot
 *           example: 10
 *         currentBookingsCount:
 *           type: number
 *           description: Number of current bookings
 *           default: 0
 *           example: 2
 *         bookingCutoffTime:
 *           type: string
 *           format: date-time
 *           description: Deadline for booking the slot
 *           example: "2024-03-20T08:00:00.000Z"
 *         status:
 *           type: string
 *           enum: ["Available", "Full", "Closed"]
 *           description: Status of the slot
 *           example: "Available"
 *         isActive:
 *           type: boolean
 *           default: true
 *         isDeleted:
 *           type: boolean
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

import { ISlotModel } from "../../utils/v1/customTypes";

export const SlotSchema: Schema = new Schema(
    {
        date: { type: Date, required: true },
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        areaId: { type: Schema.Types.ObjectId, ref: COLLECTIONS.AREA, required: true },
        capacity: { type: Number, required: true },
        currentBookingsCount: { type: Number, default: 0 },
        bookingCutoffTime: { type: Date, required: true },
        status: {
            type: String,
            enum: Object.values(SLOT_STATUS),
            default: SLOT_STATUS.AVAILABLE,
        },
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        versionKey: false,
        id: false,
    } as SchemaOptions,
);

SlotSchema.index({ areaId: 1, date: 1 });
SlotSchema.set("toObject", { virtuals: true });
SlotSchema.set("toJSON", { virtuals: true });

export const SlotModel: Model<ISlotModel> = model<ISlotModel>(COLLECTIONS.SLOT, SlotSchema);

const outcome = findJsonInJsonArray(config.DYNAMIC_MODELS, COLLECTIONS.SLOT, "name");

if (!outcome) {
    const obj: Record<string, string | typeof SlotModel> = {};
    addJson(obj, "name", COLLECTIONS.SLOT);
    addJson(obj, "model", SlotModel);
    config.DYNAMIC_MODELS.push(obj);
}
