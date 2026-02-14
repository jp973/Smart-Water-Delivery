// import { logger } from "../../utils/v1/logger";
// import { dbConnections } from "../../db/connection";
// import { COLLECTIONS } from "../../utils/v1/constants";
// import { config } from "../../config/v1/config";
// import bcrypt from "bcryptjs";

// export const initializeSeed = async () => {
//   const correlationId = `seed-${Date.now()}`;

//   try {
//     // Wait a bit to ensure connection is fully ready
//     await new Promise(resolve => setTimeout(resolve, 1000));

//     // Check if main database connection exists
//     if (!dbConnections.main) {
//       logger.warn({ correlationId }, "Main database connection not available for seeding");
//       return;
//     }

//     // Check if connection is ready
//     if (dbConnections.main.readyState !== 1) {
//       logger.warn({ correlationId, readyState: dbConnections.main.readyState }, "Database connection not ready for seeding");
//       return;
//     }

//     // Get Admin model from connection
//     const AdminModel = dbConnections.main.models[COLLECTIONS.ADMIN];

//     if (!AdminModel) {
//       logger.error({ correlationId, availableModels: Object.keys(dbConnections.main.models) }, "Admin model not found in database connection");
//       return;
//     }

//     // Check if admin already exists
//     const existingAdmin = await AdminModel.findOne({
//       email: config.SEED.SUPER_ADMIN.EMAIL.toLowerCase().trim(),
//     });

//     if (existingAdmin) {
//       logger.info({ correlationId, email: config.SEED.SUPER_ADMIN.EMAIL }, "Admin already exists, skipping seed");
//       return;
//     }

//     // Hash the password (trim to handle any whitespace)
//     const saltRounds = 10;
//     const hashedPassword = await bcrypt.hash(config.SEED.SUPER_ADMIN.PASSWORD.trim(), saltRounds);

//     // Create admin
//     const admin = new AdminModel({
//       name: config.SEED.SUPER_ADMIN.NAME,
//       email: config.SEED.SUPER_ADMIN.EMAIL.toLowerCase().trim(),
//       password: hashedPassword,
//     });

//     await admin.save();

//     logger.info({ correlationId, email: config.SEED.SUPER_ADMIN.EMAIL }, "Admin seeded successfully");
//   } catch (error) {
//     logger.error({ correlationId, data: error }, "Error seeding admin:");
//   }
// };
