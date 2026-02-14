import { Request, Response, NextFunction } from "express";
import { dbConnections } from "../db/connection";
import { exitPoint } from "./exitPoint";

export function dbSelector(req: Request, res: Response, next: NextFunction) {
  const demoHeader = req.header("X-Demo");
  const isDemo = demoHeader && demoHeader.toLowerCase() === "true";
  if (isDemo) {
    if (dbConnections.demo) {
      req.db = dbConnections.demo;
    } else {
      req.apiStatus = {
        isSuccess: false,
        message: "Demo database not found",
        status: 500,
        data: undefined,
        toastMessage: "Demo database not found",
      };
      return exitPoint(req, res);
    }
  } else {
    req.db = dbConnections.main;
  }
  next();
}
