export interface ErrorCode {
    message: string;
    errorCode: number;
    statusCode: number;
  }
  
  export const ErrorCodes: { [key: number]: ErrorCode } = {
    1001: {
      message: "Missing mandatory input params",
      errorCode: 1001,
      statusCode: 400,
    },
    1002: {
      message: "Failed to Find Data",
      errorCode: 1002,
      statusCode: 400,
    },
    1003: {
      message: "Failed to Update Data",
      errorCode: 1003,
      statusCode: 400,
    },
    1004: {
      message: "Failed to Delete Data",
      errorCode: 1004,
      statusCode: 400,
    },
    1005: {
      message: "Failed to Add Data",
      errorCode: 1005,
      statusCode: 400,
    },
    1006: {
      message: "Error",
      errorCode: 1006,
      statusCode: 400,
    },
    1007: {
      message: "ses Error",
      errorCode: 1007,
      statusCode: 400,
    },
    1008: {
      message: "Razor Pay Error",
      errorCode: 1008,
      statusCode: 400,
    },
    1009: {
      message: "Whatsapp Error",
      errorCode: 1009,
      statusCode: 400,
    },
    1010: {
      message: "Catch Error",
      errorCode: 1010,
      statusCode: 400,
    },
    1011: {
      message: "Send Otp Error",
      errorCode: 1009,
      statusCode: 400,
    },
    1012: {
      message: "Unauthorized  Error",
      errorCode: 10012,
      statusCode: 401,
    },
    1013: {
      message: "Already Exists",
      errorCode: 10013,
      statusCode: 400,
    },
    1014: {
      message: "Invalid OTP or already used",
      errorCode: 1014,
      statusCode: 400,
    },
    1015: {
      message: "OTP has expired",
      errorCode: 1015,
      statusCode: 400,
    },
    // Add other error codes here...
  };
  
  export class ResponseObj {
    public status: number;
    public message: string;
    public data: object | object[] | string;
    public toastMessage?: string;
  
    constructor(status: number, message: string, data: object | object[] | string, toastMessage?: string) {
      this.status = status;
      this.message = message;
      this.data = data;
      this.toastMessage = toastMessage;
    }
  
    public toJson(): object {
      return { status: this.status, message: this.message, data: this.data };
    }
  
    public toPlain(): string {
      return `${this.status} ${this.message} ${JSON.stringify(this.data)}`;
    }
  
    public toJsonString(): string {
      return JSON.stringify({
        status: this.status,
        message: this.message,
        data: this.data,
      });
    }
  }
  
  export enum FEEDBACK_STATUS {}
  
  export class FeedbackObj {
    public status: FEEDBACK_STATUS;
    public code: number;
    public message: string;
    public retryCount: number = 0;
  
    constructor(status: FEEDBACK_STATUS, code: number, message: string, retryCount: number) {
      this.status = status;
      this.message = message;
      this.code = code;
      this.retryCount = retryCount;
    }
  
    public toJson(): object {
      return {
        status: this.status,
        code: this.code,
        message: this.message,
        retryCount: this.retryCount,
      };
    }
  
    public toPlain(): string {
      return `${this.status} ${this.message}`;
    }
  
    public toJsonString(): string {
      return JSON.stringify({
        status: this.status,
        code: this.code,
        message: this.message,
        retryCount: this.retryCount,
      });
    }
  }
  