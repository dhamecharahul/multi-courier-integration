import { Schema, model } from "mongoose";

const ItemSchema = new Schema({
  orderId: String,
  success: Boolean,
  reason: String,
  awbNumber: String,
  status: String
}, { _id: false });

const BatchSchema = new Schema({
  batchId: { type: String, unique: true, index: true },
  status: { type: String, enum: ["QUEUED", "PROCESSING", "COMPLETED"], default: "QUEUED" },
  total: Number,
  succeeded: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  results: { type: [ItemSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { versionKey: false });

export const BatchModel = model("Batch", BatchSchema);
