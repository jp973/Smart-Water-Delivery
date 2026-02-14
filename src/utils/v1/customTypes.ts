import { Connection, Document, ObjectId, Schema, Types } from "mongoose";


import { DBModels } from "../../db/models";
import { COLLECTIONS, EXTRA_REQUEST_STATUS, SLOT_STATUS, SUBSCRIPTION_STATUS, USER_ROLES } from "./constants";
import { Logger } from "pino";


export interface IUser {
  name?: string;
  username?: string;
  countryCode?: string;
  phone?: string;
  address: {
    houseNo: string;
    street: string;
    area: Types.ObjectId | string;
    city: string;
    pincode: string;
    landmark?: string;
  };
  waterQuantity: number;
  notes?: string;
  isEnabled?: boolean;
  isVerified?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserWithId extends IUser {
  _id: Types.ObjectId;
}

export interface IUserModel extends IUser, Document { }

export interface IArea {
  _id?: Types.ObjectId | string;
  name: string;
  description: string;
  city: string;
  pincode: string;
  isDeleted?: boolean;
  totalCustomer?: number;
  totalLiters?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAreaModel extends Omit<IArea, "_id">, Document {
  _id: Types.ObjectId;
}

export interface IAdmin {
  _id?: Types.ObjectId | string;
  phone: string;
  countryCode: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAdminModel extends Omit<IAdmin, "_id">, Document {
  _id: Types.ObjectId;
}

export interface ISlot {
  _id?: Types.ObjectId | string;
  date: Date;
  startTime: Date;
  endTime: Date;
  areaId: Types.ObjectId | string;
  capacity: number;
  currentBookingsCount: number;
  bookingCutoffTime: Date;
  status: SLOT_STATUS;
  isActive: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISlotModel extends Omit<ISlot, "_id">, Document {
  _id: Types.ObjectId;
}

export interface ISlotSubscription {
  _id?: Types.ObjectId | string;
  customerId: Types.ObjectId | string;
  slotId: Types.ObjectId | string;
  quantity: number;
  status: SUBSCRIPTION_STATUS;
  deliveredAt?: Date;
  extraQuantity: number;
  extraRequestStatus: EXTRA_REQUEST_STATUS;
  isActive: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISlotSubscriptionModel extends Omit<ISlotSubscription, "_id">, Document {
  _id: Types.ObjectId;
}

export interface ISlotSubscriptionModel extends Omit<ISlotSubscription, "_id">, Document {
  _id: Types.ObjectId;
}

export interface IOtp {
  _id?: Types.ObjectId | string;
  otp: string;
  phone: string;
  countryCode: string;
  isVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOtpModel extends Omit<IOtp, "_id">, Document {
  _id: Types.ObjectId;
}

export interface IAccessToken {
  token?: string;
  userId?: Types.ObjectId;
  isDemo?: boolean;
  role: USER_ROLES;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAccessTokenModel extends IAccessToken, Document { }

export interface IRefreshToken {
  token?: string;
  userId?: Types.ObjectId;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRefreshTokenModel extends IRefreshToken, Document { }

declare global {
  namespace Express {
    interface Request {
      apiStatus?: {
        isSuccess?: boolean;
        status?: number;
        error?: {
          statusCode: number;
          message: string;
        };
        message?: string;
        data?: object | string;
        toastMessage?: string;
      };
      startTime?: number;
      txnId?: string;
      environment?: string;
      user?: (IUser | IAdmin) & {
        _id?: Types.ObjectId | string | unknown;
      };
      db: Connection & {
        models: DBModels;
      };
      log: Logger;
    }
  }
}

export interface ResponseObject {
  status: number;
  message: string | null;
  data: object | string | null;
  toastMessage: string | null;
}

export interface CustomRequest extends Request {
  // Add custom properties here
  apiStatus?: {
    isSuccess?: boolean;
    message?: string;
    data?: object | object[] | string;
    error?: {
      status: number;
      message: string;
    };
    log?: string | object | unknown;
    count?: number;

    // Add other user-related properties
  };
  startTime?: number;
  txId?: string;
  path?: string;
  baseUrl?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface SendOTPBody {
  email: string;
}

export interface VerifyOTPBody {
  email: string;
  otp: string;
}

export interface ResetPasswordBody {
  email: string;
  newPassword: string;
}

export interface RefreshTokenBody {
  refresh_token: string;
}
