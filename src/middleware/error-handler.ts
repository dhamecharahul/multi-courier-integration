import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as any).requestId;

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        fields: err.issues.map(i => ({ field: i.path.join("."), message: i.message }))
      },
      requestId
    });
  }

  const appError = err instanceof AppError
    ? err
    : new AppError("INTERNAL_ERROR", "An unexpected error occurred", 500);

  logger.error({
    request_id: requestId,
    order_id: req.params?.order_id ?? req.body?.order_id,
    courier_partner: req.body?.courier_partner,
    err
  }, "request failed");

  return res.status(appError.statusCode).json({
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      fields: appError.fields
    },
    requestId
  });
}
