import { Express } from "express-serve-static-core";
import baseRoutes from "./admin/baseRoutes";
import authRoutes from "./admin/auth";
import areaRoutes from "./admin/area";
import userRoutes from "./admin/user";
import slotRoutes from "./admin/slot";
import adminSlotSubRoutes from "./admin/slotSubscription";
import userAuthRoutes from "./user/auth";
import userSlotRoutes from "./user/slot";
import genericRoutes from "./generic/index";


export function importBaseRoutes(app: Express) {
  app.use("/v1", baseRoutes);
  app.use("/v1/admin/auth", authRoutes);
  app.use("/v1/admin/area", areaRoutes);
  app.use("/v1/admin/user", userRoutes);
  app.use("/v1/admin/slot", slotRoutes);
  app.use("/v1/admin/dashboard", adminSlotSubRoutes);
  app.use("/v1/user/auth", userAuthRoutes);
  app.use("/v1/user/slot", userSlotRoutes);
  app.use("/v1/generic", genericRoutes);
}
