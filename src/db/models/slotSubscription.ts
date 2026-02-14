import { Document, Schema, Model, model, SchemaOptions, Types } from "mongoose";
import { COLLECTIONS, EXTRA_REQUEST_STATUS, SUBSCRIPTION_STATUS } from "../../utils/v1/constants";
import { config } from "../../config/v1/config";
import { addJson, findJsonInJsonArray } from "../../utils/v1/helper";

/**
 * @swagger
 * components:
 *   schemas:
 *     SlotSubscription:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *           description: Unique identifier for the subscription
 *         customerId:
 *           type: string
 *           format: objectId
 *           description: Reference to the User (Customer)
 *         slotId:
 *           type: string
 *           format: objectId
 *           description: Reference to the Slot
 *         quantity:
 *           type: number
 *           description: Quantity of the subscription
 *           example: 1
 *         status:
 *           type: string
 *           enum: ["Booked", "Delivered", "Cancelled", "Missed"]
 *           description: Status of the subscription
 *           example: "Booked"
 *         deliveredAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the subscription was delivered
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

import { ISlotSubscription, ISlotSubscriptionModel } from "../../utils/v1/customTypes";

export const SlotSubscriptionSchema: Schema = new Schema(
    {
        customerId: { type: Schema.Types.ObjectId, ref: COLLECTIONS.USER, required: true },
        slotId: { type: Schema.Types.ObjectId, ref: COLLECTIONS.SLOT, required: true },
        quantity: { type: Number, required: true, min: 1 },
        status: {
            type: String,
            enum: Object.values(SUBSCRIPTION_STATUS),
            default: SUBSCRIPTION_STATUS.BOOKED,
        },
        deliveredAt: { type: Date },
        extraQuantity: { type: Number, default: 0 },
        extraRequestStatus: {
            type: String,
            enum: Object.values(EXTRA_REQUEST_STATUS),
            default: EXTRA_REQUEST_STATUS.NONE,
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

SlotSubscriptionSchema.index({ customerId: 1, slotId: 1 });
SlotSubscriptionSchema.set("toObject", { virtuals: true });
SlotSubscriptionSchema.set("toJSON", { virtuals: true });

export const SlotSubscriptionModel: Model<ISlotSubscriptionModel> = model<ISlotSubscriptionModel>(
    COLLECTIONS.SLOT_SUBSCRIPTION,
    SlotSubscriptionSchema,
);

const outcome = findJsonInJsonArray(config.DYNAMIC_MODELS, COLLECTIONS.SLOT_SUBSCRIPTION, "name");

if (!outcome) {
    const obj: Record<string, string | typeof SlotSubscriptionModel> = {};
    addJson(obj, "name", COLLECTIONS.SLOT_SUBSCRIPTION);
    addJson(obj, "model", SlotSubscriptionModel);
    config.DYNAMIC_MODELS.push(obj);
}
