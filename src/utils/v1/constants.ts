

export enum USER_ROLES {
  USER = "user",
  ADMIN = "admin",
}

export enum ENVIRONMENT {
  PRODUCTION = "PROD",
  STAGED = "STAGE",
  DEVELOPMENT = "DEV",
}

export const CONSTANTS = {
  MONGODB_RECONNECT_INTERVAL: 5000,
  MIN_RESEND_INTERVAL_IN_SECONDS: 60,
};

export enum COLLECTIONS {
  ACCESS_TOKEN = "accesstokens",
  REFRESH_TOKEN = "refreshtokens",
  USER = "users",
  OTP = "otps",
  ADMIN = "admins",
  AREA = "areas",
  SLOT = "slots",
  SLOT_SUBSCRIPTION = "slotsubscriptions",
}

export enum SUBSCRIPTION_STATUS {
  BOOKED = "Booked",
  DELIVERED = "Delivered",
  CANCELLED = "Cancelled",
  MISSED = "Missed",
}

export enum SLOT_STATUS {
  AVAILABLE = "Available",
  FULL = "Full",
  CLOSED = "Closed",
}

export enum EXTRA_REQUEST_STATUS {
  NONE = "None",
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
}