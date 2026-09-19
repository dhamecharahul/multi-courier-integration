import { randomUUID } from "crypto";
import { BatchModel } from "../models/batch.model";
import { NormalizedOrder } from "../couriers/types";
import { OrderService } from "./order.service";
import { logger } from "../utils/logger";

export class BulkService {
  constructor(private orders: OrderService, private concurrency: number) {}

  async submit(items: NormalizedOrder[]) {
    const batchId = randomUUID();
    await BatchModel.create({ batchId, total: items.length, status: "QUEUED" });

    // Fire-and-forget background work. In production, replace this with SQS/BullMQ
    // so jobs survive process restarts and can be horizontally scaled.
    void this.process(batchId, items);
    return { batchId, status: "QUEUED", total: items.length };
  }

  private async process(batchId: string, items: NormalizedOrder[]) {
    await BatchModel.updateOne({ batchId }, { $set: { status: "PROCESSING" } });
    const results: any[] = [];
    let cursor = 0;

    const worker = async () => {
      while (true) {
        const index = cursor++;
        if (index >= items.length) return;
        const item = items[index];
        try {
          const result: any = await this.orders.create(item);
          results[index] = {
            orderId: item.order_id, success: true,
            awbNumber: result.awbNumber, status: result.status
          };
        } catch (error: any) {
          results[index] = {
            orderId: item.order_id, success: false,
            reason: error?.message ?? "Order processing failed"
          };
          logger.error({ batchId, order_id: item.order_id, err: error }, "bulk item failed");
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(this.concurrency, items.length) }, worker));

    const succeeded = results.filter(r => r?.success).length;
    await BatchModel.updateOne({ batchId }, {
      $set: { status: "COMPLETED", succeeded, failed: items.length - succeeded, results, updatedAt: new Date() }
    });
  }

  async get(batchId: string) {
    return BatchModel.findOne({ batchId }).lean();
  }
}
