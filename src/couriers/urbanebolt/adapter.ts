import axios, { AxiosInstance } from "axios";
import { config } from "../../config";
import { CourierApiError } from "../../utils/errors";
import { withRetry } from "../../utils/retry";
import { CourierAdapter, CourierResult, NormalizedOrder, TrackingResult } from "../types";
import { normalizeStatus, toUrbaneBoltCreatePayload } from "./mapper";

export class UrbaneBoltAdapter implements CourierAdapter {
  readonly name = "urbanebolt";
  private http: AxiosInstance;
  private token?: string;

  constructor() {
    this.http = axios.create({
      baseURL: config.urbanebolt.baseUrl,
      timeout: config.httpTimeoutMs,
      headers: { "Content-Type": "application/json", Accept: "application/json" }
    });
  }

  private async authenticate() {
    const response = await this.http.post(config.urbanebolt.authPath, {
      username: config.urbanebolt.username,
      password: config.urbanebolt.password,
      customer_code: config.urbanebolt.customerCode
    });
    this.token = response.data?.access_token ?? response.data?.token;
    if (!this.token) throw new CourierApiError("COURIER_AUTH_FAILED", "Courier authentication failed", 502);
  }

  private isAuthFailure(error: any) {
    return error?.response?.status === 401 || error?.response?.status === 403;
  }

  private async request<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.token) await this.authenticate();
    try {
      return await withRetry(fn, {
        shouldRetry: (e: any) => !this.isAuthFailure(e) &&
          (!e?.response || e.response.status >= 500 || e.code === "ECONNABORTED" || e.code === "ETIMEDOUT")
      });
    } catch (error: any) {
      if (this.isAuthFailure(error)) {
        this.token = undefined;
        await this.authenticate();
        return await withRetry(fn, {
          shouldRetry: (e: any) => !this.isAuthFailure(e) &&
            (!e?.response || e.response.status >= 500 || e.code === "ECONNABORTED" || e.code === "ETIMEDOUT")
        });
      }
      throw this.mapError(error);
    }
  }

  private mapError(error: any): CourierApiError {
    const status = error?.response?.status;
    if (status && status >= 400 && status < 500) {
      return new CourierApiError("COURIER_REQUEST_REJECTED", "Courier rejected the request", 502, status);
    }
    return new CourierApiError("COURIER_UNAVAILABLE", "Courier service is temporarily unavailable", 503, status);
  }

  async createShipment(order: NormalizedOrder): Promise<CourierResult> {
    const payload = toUrbaneBoltCreatePayload(order);
    const response: any = await this.request(() => this.http.post(
      config.urbanebolt.createPath,
      payload,
      { headers: { Authorization: `Bearer ${this.token}` } }
    ));
    const data = response.data ?? {};
    return {
      courierOrderId: data.order_id ?? data.orderId ?? data.shipment_id ?? data.shipmentId,
      awbNumber: data.awb ?? data.awb_number ?? data.tracking_number ?? data.trackingNumber,
      status: normalizeStatus(data.status ?? "CREATED"),
      courierRequest: payload,
      courierResponse: data
    };
  }

  async trackShipment(order: NormalizedOrder, awbNumber: string): Promise<TrackingResult> {
    const payload = { customer_code: config.urbanebolt.customerCode, order_id: order.order_id, awb: awbNumber };
    const response: any = await this.request(() => this.http.post(
      config.urbanebolt.trackPath,
      payload,
      { headers: { Authorization: `Bearer ${this.token}` } }
    ));
    const data = response.data ?? {};
    const rawEvents = Array.isArray(data.events) ? data.events : Array.isArray(data.history) ? data.history : [data];
    const events = rawEvents.map((e: any) => ({
      status: normalizeStatus(e.status ?? e.event ?? data.status),
      eventAt: new Date(e.timestamp ?? e.event_at ?? Date.now()),
      rawPayload: e
    }));
    const latest = events.at(-1);
    return {
      status: latest?.status ?? normalizeStatus(data.status),
      awbNumber: data.awb ?? data.awb_number ?? awbNumber,
      events,
      rawResponse: data
    };
  }

  async cancelShipment(order: NormalizedOrder, courierOrderId?: string, awbNumber?: string): Promise<CourierResult> {
    const payload = {
      customer_code: config.urbanebolt.customerCode,
      order_id: courierOrderId ?? order.order_id,
      awb: awbNumber
    };
    const response: any = await this.request(() => this.http.post(
      config.urbanebolt.cancelPath,
      payload,
      { headers: { Authorization: `Bearer ${this.token}` } }
    ));
    return {
      courierOrderId,
      awbNumber,
      status: "CANCELLED",
      courierRequest: payload,
      courierResponse: response.data
    };
  }
}
