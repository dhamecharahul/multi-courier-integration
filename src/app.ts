import express from "express";
import pinoHttp from "pino-http";
import { logger } from "./utils/logger";
import { requestId } from "./middleware/request-id";
import { errorHandler } from "./middleware/error-handler";
import { CourierRegistry } from "./couriers/registry";
import { MockCourierAdapter } from "./couriers/mock/mock.adapter";
import { UrbaneBoltAdapter } from "./couriers/urbanebolt/adapter";
import { OrderService } from "./services/order.service";
import { BulkService } from "./services/bulk.service";
import { buildRoutes } from "./api/routes";

export function createApp() {
  const registry = new CourierRegistry();
  registry.register(new MockCourierAdapter());
  registry.register(new UrbaneBoltAdapter());

  const orderService = new OrderService(registry);
  const bulkService = new BulkService(orderService, 5);

  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use(requestId);
  app.use(pinoHttp({ logger }));
  app.get("/health", (_req, res) => res.json({ status: "ok", service: "multi-courier" }));
  app.use("/api/v1", buildRoutes(orderService, bulkService));
  app.use(errorHandler);
  return app;
}
