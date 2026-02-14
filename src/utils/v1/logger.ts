import pino, { Logger } from "pino";
import { randomUUID } from "crypto";
import os from "os";
import { Request, Response, NextFunction } from "express";

function getServiceName(): string {
  return "admin-server-service";
}

function getInstanceName(): string {
  return os.hostname();
}

const logger: Logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: {
    service: getServiceName(),
    instance: getInstanceName(),
  },
});

function attachLogger() {
  return function (req: Request, res: Response, next: NextFunction): void {
    const correlationId = (req.headers["x-correlation-id"] as string) || randomUUID();
    req.log = logger.child({ correlationId });
    res.setHeader("x-correlation-id", correlationId);
    next();
  };
}

function withCorrelation(correlationId: string) {
  return logger.child({
    correlationId: correlationId || randomUUID(),
  });
}

export { logger, attachLogger, withCorrelation };
