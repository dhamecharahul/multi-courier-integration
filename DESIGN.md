# Design Notes

This project follows a simple adapter + registry pattern.

## 1. Main pattern

We define one stable internal contract for every courier: create shipment, track shipment, and cancel shipment.

Each courier adapter handles two jobs:
- translate our internal order model into the provider's request format
- convert the provider response back into our standard format

That keeps the rest of the app from depending on any one courier implementation.

## 2. Request flow

```text
POST /orders
  -> validate request
  -> OrderService
  -> CourierRegistry.get(courier_partner)
  -> Adapter.createShipment()
  -> save request and response
  -> add tracking event
  -> return normalized result
```

Tracking and cancellation follow the same overall path. For tracking, the app also stores each provider update in the tracking history collection.

## 3. Database structure

### orders

- _id
- orderId (unique)
- courierPartner
- courierOrderId
- awbNumber
- status
- normalizedRequest
- courierRequest
- courierResponse
- lastError
- createdAt
- updatedAt

### tracking_history

This is append-only data.

- orderId
- courierPartner
- status
- eventAt
- rawPayload
- createdAt

### batches

- batchId
- status
- total
- succeeded
- failed
- per-item results

## 4. Idempotency

The orderId field is unique in MongoDB. If the same order is sent twice, the second call returns the existing order instead of creating a duplicate shipment.

This is important because simple app-level checks are not enough when multiple requests arrive at the same time. The database uniqueness rule is the real protection.

## 5. Bulk processing

The API creates a batch record immediately and returns HTTP 202. A limited worker pool then processes the orders in the background.

Why this is useful:
- the request thread is not blocked by 100 courier calls
- each order can fail independently
- clients can poll batch status later
- we avoid a large uncontrolled burst of requests

The trade-off is that the sample worker runs inside the same process, so it is not durable across crashes. In production, a queue such as SQS, RabbitMQ, or BullMQ would be better.

## 6. Error handling

All API responses follow the same basic shape:

```json
{
  "success": false,
  "error": {
    "code": "NORMALIZED_CODE",
    "message": "Safe client message",
    "fields": []
  },
  "requestId": "..."
}
```

Rules:
- courier 4xx -> COURIER_REQUEST_REJECTED
- courier timeout, network, or 5xx -> COURIER_UNAVAILABLE after retry
- courier 401 or 403 -> refresh credentials and retry once
- unexpected exception -> INTERNAL_ERROR

## 7. Observability

Every request gets an x-request-id. Logs include the request ID, order ID, and courier partner when it is available.

For a real production setup, we would also add:
- OpenTelemetry tracing
- metrics for courier success and latency
- circuit breakers
- dead-letter queues
- alerting for failures
- secret management instead of plain environment variables

## 8. Adding a new courier

To add another provider, create a new adapter file such as:

```text
src/couriers/delhivery/adapter.ts
```

The adapter should:
- handle authentication
- send provider requests
- map request payloads
- map response values and statuses
- convert provider errors into our normalized error model

The rest of the app should not need provider-specific logic. Controllers, services, and routes should keep working with the same internal order model.
