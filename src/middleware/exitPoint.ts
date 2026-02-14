import { ResponseObject } from "../utils/v1/customTypes";
import { Request, Response } from "express";

export const exitPoint = (req: Request, res: Response) => {
  let responseObj: ResponseObject = {} as ResponseObject;
  if (req.apiStatus?.isSuccess) {
    responseObj = {
      status: req.apiStatus.status || 200,
      message: req.apiStatus.message || null,
      data: req.apiStatus.data || null,
      toastMessage: req.apiStatus.toastMessage || null,
    };
  } else {
    responseObj = {
      status: req.apiStatus?.status || 500,
      message: req.apiStatus?.message || "Internal Server Error",
      data: req.apiStatus?.data || null,
      toastMessage: req.apiStatus?.toastMessage || "An unexpected error occurred",
    };
  }
  res.setHeader("X-Transaction-Id", req.txnId || null);
  res.setHeader("X-Response-Time", `${Date.now() - req.startTime}ms`);
  res.setHeader("X-Environment", req.environment || null);
  res.status(responseObj.status).json(responseObj);
};
