import mongoose, { Connection } from "mongoose";
import { CONSTANTS } from "../utils/v1/constants";
import { config } from "../config/v1/config";
import { DBModels, registerAllModels } from "./models/index";
import { initializeSeed } from "../seed/v1";


export const DB_STATE = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3,
};

export interface DBConnections {
  main: Connection & {
    models: DBModels;
  };
  demo?: Connection & {
    models: DBModels;
  };
}

export const dbConnections: DBConnections = {
  main: undefined,
  demo: undefined,
};

let initializationPromise: Promise<void> | null = null;

export async function initializeAllDBConnections() {
  if (dbConnections.main) return;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    console.log("Initializing all DB connections...");
    const mainConn = await mongoose.createConnection(config.MONGODB_URI, {
      serverSelectionTimeoutMS: CONSTANTS.MONGODB_RECONNECT_INTERVAL,
    });
    await registerAllModels(mainConn);

    let seedInitialized = false;
    mainConn.on("error", err => {
      console.error("Mongoose error (main connection)", err);
    });
    mainConn.on("connected", async () => {
      console.info("Mongodb main connection connected");
      if (!seedInitialized) {
        seedInitialized = true;
        await initializeSeed();
      }
    });
    mainConn.on("disconnected", () => {
      console.info("Mongoose main connection disconnected");
    });
    // If connection is already connected, initialize seed immediately
    if (mainConn.readyState === 1 && !seedInitialized) {
      seedInitialized = true;
      await initializeSeed();
    }
    dbConnections.main = mainConn as Connection & {
      models: DBModels;
    };

    if (config.DEMO_MONGODB_URI) {
      const demoConn = await mongoose.createConnection(config.DEMO_MONGODB_URI, {
        serverSelectionTimeoutMS: CONSTANTS.MONGODB_RECONNECT_INTERVAL,
      });
      await registerAllModels(demoConn);
      demoConn.on("error", err => {
        console.error("Mongoose error (demo connection)", err);
      });
      demoConn.on("connected", async () => {
        console.info("Mongodb demo connection connected");
      });
      demoConn.on("disconnected", () => {
        console.info("Mongoose demo connection disconnected");
      });
      dbConnections.demo = demoConn as Connection & {
        models: DBModels;
      };
    }
  })();

  return initializationPromise;
}
