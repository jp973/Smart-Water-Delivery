import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import errorhandler from "errorhandler";
import HttpException from "./exceptions/v1/HttpException";
import { config } from "./config/v1/config";
import rateLimit from "express-rate-limit";
import { initializeAllDBConnections } from "./db/connection";
import {
  importBaseRoutes,
} from './routes/v1/index';
import { attachLogger } from "./utils/v1/logger";

const port: number = config.PORT;

if (process.env.NODE_ENV !== "test") {
  (async () => {
    try {
      await initializeAllDBConnections();
      console.info("Database connections initialized successfully.");
      console.info("Seed data initialized successfully.");
    } catch (err) {
      console.error(err);
    }
  })();
}

const app = express();

// MiddleWare to ensure DB is connected (Important for Serverless like Vercel)
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dbConnections, initializeAllDBConnections } = await import("./db/connection");
    if (!dbConnections.main) {
      await initializeAllDBConnections();
    }
    req.db = dbConnections.main; // Default to main
    next();
  } catch (err) {
    console.error("DB Initialization Error:", err);
    res.status(500).json({ message: "Internal Server Error: Database connection failed" });
  }
});

app.use(rateLimit({ windowMs: 1 * 5 * 1000, max: 1500, standardHeaders: true, legacyHeaders: false }));
app.set("port", port);
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "100mb", parameterLimit: 50000 }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "Authorization",
      "X-reqed-With",
      "Content-Type",
      "Accept",
      "X-Demo",
      "X-Request-URL",
      "X-Transaction-Id",
      "X-Response-Time",
      "X-Environment",
    ],
  }),
);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(hpp());
app.disable("x-powered-by");

if ("development" === app.get("env")) {
  app.use(errorhandler());
}

if ("production" === app.get("env")) {
  console.info("Running in Production Environment");
}

app.use(express.static("public"));

app.use(attachLogger());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Smart Water Delivery API is running!", status: "Healthy" });
});

importBaseRoutes(app)

app.use(function (req: Request, res: Response, next: NextFunction): void {
  const err: HttpException = new HttpException(404, "Page/Api Not Found");
  next(err);
});

// Skip app.listen when running on Vercel as a serverless function
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(port, () => {
    console.info(`Server is running on port ${port} in ${app.get("env")} mode`);
  });
}

process.on("SIGINT", function () {
  process.exit(0);
});

process.on("SIGTERM", function () {
  process.exit(0);
});

export default app;
