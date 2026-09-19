import { randomUUID } from "crypto";
import { OrderModel } from "../models/order.model";
import { TrackingModel } from "../models/tracking.model";
import { CourierRegistry } from "../couriers/registry";
import { NormalizedOrder } from "../couriers/types";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export class OrderService {
  constructor(private registry: CourierRegistry) {}

  async create(order: NormalizedOrder) {
    const existing = await OrderModel.findOne({ orderId: order.order_id }).lean();
    if (existing) return { ...existing, idempotent: true };

    const adapter = this.registry.get(order.courier_partner);

    const draft = await OrderModel.create({
      orderId: order.order_id,
      courierPartner: order.courier_partner,
      status: "CREATED",
      normalizedRequest: order
    });

    try {
      const result = await adapter.createShipment(order);
      draft.courierOrderId = result.courierOrderId;
      draft.awbNumber = result.awbNumber;
      draft.status = result.status;
      draft.courierRequest = result.courierRequest;
      draft.courierResponse = result.courierResponse;
      await draft.save();

      await TrackingModel.create({
        orderId: order.order_id,
        courierPartner: order.courier_partner,
        status: result.status,
        eventAt: new Date(),
        rawPayload: result.courierResponse
      });

      return draft.toObject();
    } catch (error: any) {
      draft.status = "FAILED";
      draft.lastError = { code: error?.code ?? "COURIER_ERROR", message: error?.message ?? "Courier call failed" };
      await draft.save();
      logger.error({ order_id: order.order_id, courier_partner: order.courier_partner, err: error }, "shipment creation failed");
      throw error;
    }
  }

  async track(orderId: string) {
    const order: any = await OrderModel.findOne({ orderId }).lean();
    if (!order) throw new AppError("ORDER_NOT_FOUND", "Order not found", 404);

    const adapter = this.registry.get(order.courierPartner);
    if (!order.awbNumber) throw new AppError("AWB_NOT_AVAILABLE", "Shipment does not have an AWB", 409);

    const result = await adapter.trackShipment(order.normalizedRequest, order.awbNumber);
    const last = result.events.at(-1);

    if (last) {
      await TrackingModel.insertMany(result.events.map(e => ({
        orderId,
        courierPartner: order.courierPartner,
        status: e.status,
        eventAt: e.eventAt,
        rawPayload: e.rawPayload
      })));
      await OrderModel.updateOne({ orderId }, { $set: { status: result.status, awbNumber: result.awbNumber } });
    }

    const history = await TrackingModel.find({ orderId }).sort({ eventAt: 1 }).lean();
    return { orderId, awbNumber: result.awbNumber, status: result.status, events: history };
  }

  async cancel(orderId: string) {
    const order: any = await OrderModel.findOne({ orderId });
    if (!order) throw new AppError("ORDER_NOT_FOUND", "Order not found", 404);
    if (order.status === "CANCELLED") return order.toObject();

    const adapter = this.registry.get(order.courierPartner);
    const result = await adapter.cancelShipment(order.normalizedRequest, order.courierOrderId, order.awbNumber);

    order.status = "CANCELLED";
    order.courierRequest = result.courierRequest;
    order.courierResponse = result.courierResponse;
    await order.save();

    await TrackingModel.create({
      orderId,
      courierPartner: order.courierPartner,
      status: "CANCELLED",
      eventAt: new Date(),
      rawPayload: result.courierResponse
    });

    return order.toObject();
  }
}
