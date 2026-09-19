import { Schema, model } from "mongoose";

const OrderSchema = new Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  courierPartner: { type: String, required: true, index: true },
  courierOrderId: String,
  awbNumber: String,
  status: { type: String, required: true, default: "CREATED", index: true },
  normalizedRequest: { type: Schema.Types.Mixed, required: true },
  courierRequest: { type: Schema.Types.Mixed },
  courierResponse: { type: Schema.Types.Mixed },
  lastError: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { versionKey: false });

OrderSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

export const OrderModel = model("Order", OrderSchema);
