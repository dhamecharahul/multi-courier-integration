import { Schema, model } from "mongoose";

const TrackingSchema = new Schema({
  orderId: { type: String, required: true, index: true },
  courierPartner: { type: String, required: true },
  status: { type: String, required: true },
  eventAt: { type: Date, required: true },
  rawPayload: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

TrackingSchema.index({ orderId: 1, eventAt: 1 });
export const TrackingModel = model("TrackingHistory", TrackingSchema);
