import { Request, Response, NextFunction } from "express";
import { exitPoint } from "./exitPoint";
import { COLLECTIONS, USER_ROLES } from "../utils/v1/constants";
import { toObjectId } from "../utils/v1/helper";
import { IUserModel } from "../utils/v1/customTypes";


const authenticator = (role: USER_ROLES) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        req.apiStatus = {
          isSuccess: false,
          message: "Unauthorized",
          status: 401,
          data: undefined,
          toastMessage: "Unauthorized",
        };
        return exitPoint(req, res);
      }

      const token = authHeader.split(" ")[1];

      const tokenFromDb = await req.db.models[COLLECTIONS.ACCESS_TOKEN].findOne({
        token,
        role,
      });

      if (!tokenFromDb) {
        req.apiStatus = {
          isSuccess: false,
          message: "Unauthorized",
          status: 401,
          data: undefined,
          toastMessage: "Unauthorized",
        };
        return exitPoint(req, res);
      }

      const uid = toObjectId(tokenFromDb.userId);
      let user;

      if (role === USER_ROLES.ADMIN) {
        user = await req.db.models[COLLECTIONS.ADMIN].findById(uid);
      } else if (role === USER_ROLES.USER) {
        user = await req.db.models[COLLECTIONS.USER].findById(uid);
      }

      // if (!user || user?.isDeleted !== false || user?.isEnabled !== true) {
      //   req.apiStatus = {
      //     isSuccess: false,
      //     message: "Unauthorized",
      //     status: 401,
      //     data: undefined,
      //     toastMessage: "Unauthorized",
      //   };
      //   return exitPoint(req, res, next);
      // }
      req.user = user;
      return next();
    } catch (err) {
      console.error("Authentication error:", err);
      req.apiStatus = {
        isSuccess: false,
        message: "Unauthorized",
        status: 401,
        data: undefined,
        toastMessage: "Unauthorized",
      };
      return exitPoint(req, res);
    }
  };
};

export const adminAuthenticator = authenticator(USER_ROLES.ADMIN);

export const userAuthenticator = authenticator(USER_ROLES.USER);


