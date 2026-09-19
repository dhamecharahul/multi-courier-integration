export type ShipmentStatus =
  | "CREATED" | "PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY"
  | "DELIVERED" | "CANCELLED" | "FAILED" | "UNKNOWN";

export interface Address {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  mobile: string;
  email?: string;
}

export interface NormalizedOrder {
  courier_partner: string;
  order_id: string;
  weight: number;
  payment_mode: "PREPAID" | "COD";
  collectable_value: number;
  declared_value: number;
  item_description: string;
  service_type?: string;
  dimensions: { length: number; breadth: number; height: number };
  consignee: Address;
  shipper: Address;
}

export interface CourierResult {
  courierOrderId?: string;
  awbNumber?: string;
  status: ShipmentStatus;
  courierRequest: unknown;
  courierResponse: unknown;
}

export interface TrackingResult {
  status: ShipmentStatus;
  awbNumber?: string;
  events: Array<{ status: ShipmentStatus; eventAt: Date; rawPayload: unknown }>;
  rawResponse: unknown;
}

export interface CourierAdapter {
  readonly name: string;
  createShipment(order: NormalizedOrder): Promise<CourierResult>;
  trackShipment(order: NormalizedOrder, awbNumber: string): Promise<TrackingResult>;
  cancelShipment(order: NormalizedOrder, courierOrderId?: string, awbNumber?: string): Promise<CourierResult>;
}
