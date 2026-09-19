import { NormalizedOrder, ShipmentStatus } from "../types";

/**
 * Keep all provider-specific field mapping here.
 * If the UrbaneBolt UAT collection changes, this file changes;
 * controllers and business services do not.
 */
export function toUrbaneBoltCreatePayload(order: NormalizedOrder) {
  return {
    customer_code: process.env.URBANEBOLT_CUSTOMER_CODE,
    order_id: order.order_id,
    weight: order.weight,
    payment_mode: order.payment_mode,
    collectable_value: order.collectable_value,
    declared_value: order.declared_value,
    item_description: order.item_description,
    service_type: order.service_type,
    dimensions: order.dimensions,
    consignee: order.consignee,
    shipper: order.shipper
  };
}

export function normalizeStatus(value: unknown): ShipmentStatus {
  const s = String(value ?? "").toUpperCase().replace(/[\s-]+/g, "_");
  const map: Record<string, ShipmentStatus> = {
    CREATED: "CREATED",
    BOOKED: "CREATED",
    PICKED_UP: "PICKED_UP",
    PICKUP: "PICKED_UP",
    IN_TRANSIT: "IN_TRANSIT",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
    CANCELED: "CANCELLED",
    FAILED: "FAILED"
  };
  return map[s] ?? "UNKNOWN";
}
