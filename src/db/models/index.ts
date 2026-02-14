import { Connection, Model } from "mongoose";
import { UserSchema } from "./users";
import { COLLECTIONS } from "../../utils/v1/constants";
import { AdminSchema } from "./admin";
import { OtpSchema } from "./otp";
import { AccessTokenSchema } from "./accessToken";
import { RefreshTokenSchema } from "./refreshToken";
import { AreaSchema } from "./area";
import { SlotSchema } from "./slot";
import { SlotSubscriptionSchema } from "./slotSubscription";
import { IUser, IAdmin, IAreaModel, IOtpModel, IAccessTokenModel, IRefreshTokenModel, ISlotModel, ISlotSubscriptionModel } from "../../utils/v1/customTypes";


export interface DBModels {

    [COLLECTIONS.USER]: Model<IUser>;
    [COLLECTIONS.ADMIN]: Model<IAdmin>;
    [COLLECTIONS.OTP]: Model<IOtpModel>;
    [COLLECTIONS.ACCESS_TOKEN]: Model<IAccessTokenModel>;
    [COLLECTIONS.REFRESH_TOKEN]: Model<IRefreshTokenModel>;
    [COLLECTIONS.AREA]: Model<IAreaModel>;
    [COLLECTIONS.SLOT]: Model<ISlotModel>;
    [COLLECTIONS.SLOT_SUBSCRIPTION]: Model<ISlotSubscriptionModel>;

}

export async function registerAllModels(conn: Connection) {

    conn.model<IUser>(COLLECTIONS.USER, UserSchema)
    conn.model<IAdmin>(COLLECTIONS.ADMIN, AdminSchema)
    conn.model<IOtpModel>(COLLECTIONS.OTP, OtpSchema)
    conn.model<IAccessTokenModel>(COLLECTIONS.ACCESS_TOKEN, AccessTokenSchema)
    conn.model<IRefreshTokenModel>(COLLECTIONS.REFRESH_TOKEN, RefreshTokenSchema)
    conn.model<IAreaModel>(COLLECTIONS.AREA, AreaSchema)
    conn.model<ISlotModel>(COLLECTIONS.SLOT, SlotSchema)
    conn.model<ISlotSubscriptionModel>(COLLECTIONS.SLOT_SUBSCRIPTION, SlotSubscriptionSchema)
}
