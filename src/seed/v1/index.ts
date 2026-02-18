import { logger } from "../../utils/v1/logger";
import { dbConnections } from "../../db/connection";
import { COLLECTIONS } from "../../utils/v1/constants";
import { config } from "../../config/v1/config";
import bcrypt from "bcryptjs";

export const initializeSeed = async () => {
  const correlationId = `seed-${Date.now()}`;

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!dbConnections.main) {
      logger.warn({ correlationId }, "Main database connection not available for seeding");
      return;
    }

    if (dbConnections.main.readyState !== 1) {
      logger.warn({ correlationId, readyState: dbConnections.main.readyState }, "Database connection not ready for seeding");
      return;
    }

    const AdminModel = dbConnections.main.models[COLLECTIONS.ADMIN];

    if (!AdminModel) {
      logger.error({ correlationId, availableModels: Object.keys(dbConnections.main.models) }, "Admin model not found in database connection");
      return;
    }

    const normalizedEmail = config.SEED.SUPER_ADMIN.EMAIL.toLowerCase().trim();

    const existingAdmin = await AdminModel.findOne({
      email: normalizedEmail,
    });

    if (existingAdmin) {
      logger.info({ correlationId, email: config.SEED.SUPER_ADMIN.EMAIL }, "Admin already exists, skipping seed");
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(config.SEED.SUPER_ADMIN.PASSWORD.trim(), saltRounds);

    await AdminModel.create({
      name: config.SEED.SUPER_ADMIN.NAME,
      email: normalizedEmail,
      password: hashedPassword,
    });

    logger.info({ correlationId, email: config.SEED.SUPER_ADMIN.EMAIL }, "Admin seeded successfully");
  } catch (error) {
    logger.error({ correlationId, data: error }, "Error seeding admin:");
  }
};
