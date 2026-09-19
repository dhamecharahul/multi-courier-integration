# Interview walkthrough

## 60-second architecture answer

"I expose one normalized REST API. Controllers validate only the internal contract. OrderService owns business rules and persistence. A CourierRegistry resolves a provider adapter from `courier_partner`. Every adapter implements the same contract for create, track and cancel. Provider-specific authentication, payload mapping and response normalization stay inside the adapter. Orders and raw courier request/response are persisted for audit, while tracking events are append-only. Bulk requests return 202 with a batch ID and use bounded concurrency. For production I would move the worker to SQS/BullMQ, add a dead-letter queue, circuit breaker and distributed tracing."

## Likely interviewer questions

### Why Adapter pattern?
Because courier APIs have different authentication, payloads and response formats. The business layer should depend on a stable contract rather than provider details.

### Why not put if/else in the service?
That violates separation of concerns and makes every new courier modify business logic. A registry/adapter keeps provider code isolated.

### How do you guarantee idempotency?
Unique `orderId` index at the database layer. The service first checks for an existing record, and the unique index protects concurrent requests.

### What happens if courier times out after creating the shipment?
This is the classic ambiguous outcome. Retrying blindly can create duplicates. A production design should use provider idempotency keys if supported, otherwise reconcile by merchant order reference before creating another shipment.

### Why 202 for bulk?
The request should not wait for 100 external calls. The client gets a batch ID and can poll the batch status.

### How would you scale it?
Move batch jobs to SQS/BullMQ, run multiple workers, use Mongo replica set/managed DB, add rate limits per courier, circuit breakers and metrics.

### How would you add Delhivery?
Implement `CourierAdapter`, add its mapper/client/error normalization, and register it. No route or OrderService change.

### What would you improve before production?
1. Durable queue
2. Distributed idempotency/locking
3. Circuit breaker
4. OpenTelemetry
5. Metrics and alerting
6. Secret manager
7. Encryption/redaction for PII in audit payloads
8. Contract tests against each courier sandbox
9. Dead-letter/reconciliation workflow
10. API authentication and rate limiting
