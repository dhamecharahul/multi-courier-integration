import { CourierAdapter, CourierResult, NormalizedOrder, TrackingResult } from "../types";

export class MockCourierAdapter implements CourierAdapter {
  readonly name = "mockcourier";

  async createShipment(order: NormalizedOrder): Promise<CourierResult> {
    const awb = `MOCK-${order.order_id}`;
    return {
      courierOrderId: `MOCK-ORDER-${order.order_id}`,
      awbNumber: awb,
      status: "CREATED",
      courierRequest: { mock: true, order },
      courierResponse: { id: `MOCK-ORDER-${order.order_id}`, awb, status: "CREATED" }
    };
  }

  async trackShipment(_order: NormalizedOrder, awbNumber: string): Promise<TrackingResult> {
    return {
      status: "IN_TRANSIT",
      awbNumber,
      events: [{ status: "IN_TRANSIT", eventAt: new Date(), rawPayload: { awb: awbNumber, status: "IN_TRANSIT" } }],
      rawResponse: { awb: awbNumber, status: "IN_TRANSIT" }
    };
  }

  async cancelShipment(order: NormalizedOrder): Promise<CourierResult> {
    return {
      courierOrderId: `MOCK-ORDER-${order.order_id}`,
      awbNumber: `MOCK-${order.order_id}`,
      status: "CANCELLED",
      courierRequest: { orderId: order.order_id },
      courierResponse: { status: "CANCELLED" }
    };
  }
}
