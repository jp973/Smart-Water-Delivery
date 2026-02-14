import { RequestHandler } from "express";
import * as Helper from "../utils/v1/helper";
import { Request, Response, NextFunction } from "express";
import { config } from "../config/v1/config";

export const entryPoint: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  req.startTime = Date.now();
  req.txnId = Helper.generateTransactionId();
  req.environment = config.ENVIRONMENT;
  req.apiStatus = {};
  next();
};
