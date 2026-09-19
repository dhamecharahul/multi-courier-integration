import { Router, Request, Response, NextFunction } from "express";
import { orderSchema, bulkSchema } from "./schemas";
import { OrderService } from "../services/order.service";
import { BulkService } from "../services/bulk.service";
import { config } from "../config";

export function buildRoutes(orderService: OrderService, bulkService: BulkService) {
  const router = Router();

  router.post("/orders", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = orderSchema.parse(req.body);
      const result = await orderService.create(order);
      res.status(result.idempotent ? 200 : 201).json({ success: true, data: result, requestId: (req as any).requestId });
    } catch (e) { next(e); }
  });

  router.get("/orders/:order_id/track", async (req, res, next) => {
    try {
      const result = await orderService.track(req.params.order_id);
      res.json({ success: true, data: result, requestId: (req as any).requestId });
    } catch (e) { next(e); }
  });

  router.post("/orders/:order_id/cancel", async (req, res, next) => {
    try {
      const result = await orderService.cancel(req.params.order_id);
      res.json({ success: true, data: result, requestId: (req as any).requestId });
    } catch (e) { next(e); }
  });

  router.post("/orders/bulk", async (req, res, next) => {
    try {
      const body = bulkSchema.parse(req.body);
      if (body.orders.length > config.bulk.maxOrders) {
        return res.status(400).json({
          success: false,
          error: { code: "BATCH_TOO_LARGE", message: `Maximum ${config.bulk.maxOrders} orders are allowed`, fields: [] },
          requestId: (req as any).requestId
        });
      }
      const result = await bulkService.submit(body.orders);
      res.status(202).json({ success: true, data: result, requestId: (req as any).requestId });
    } catch (e) { next(e); }
  });

  router.get("/orders/bulk/:batch_id", async (req, res, next) => {
    try {
      const result = await bulkService.get(req.params.batch_id);
      if (!result) return res.status(404).json({ success: false, error: { code: "BATCH_NOT_FOUND", message: "Batch not found", fields: [] }, requestId: (req as any).requestId });
      res.json({ success: true, data: result, requestId: (req as any).requestId });
    } catch (e) { next(e); }
  });

  return router;
}
