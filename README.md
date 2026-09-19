# Multi-Courier Integration Platform

This project is a small shipping service built with Node.js, TypeScript, Express, and MongoDB. It gives one common API for multiple courier providers while keeping each courier's details separate behind a clean adapter layer.

## How it is structured

```text
Client / OMS
    |
    v
Express API
    |
    v
OrderService / BulkService
    |
    v
CourierRegistry
   / \
  /   \
UrbaneBolt  MockCourier
 Adapter      Adapter
   |
   v
Courier APIs

MongoDB:
  orders
  tracking_history
  batches
```

The main idea is simple: business logic talks to a shared courier interface, not to any one provider directly. That means the app can work with UrbaneBolt, a mock courier, or another provider later without changing the main order flow.

If we add a new courier, we create a new adapter, register it, and keep the rest of the code as it is.

## Setup

Requirements:
- Node.js 20+
- Docker

Run:

```bash
npm install
cp .env.example .env
docker compose up -d mongodb
npm run typecheck
npm test
npm run dev
```

The app runs on http://localhost:3000.

## Configuration

Keep all env values in a local .env file and do not commit it.

Important settings:
- MONGODB_URI
- BULK_MAX_ORDERS
- BULK_CONCURRENCY
- RETRY_MAX_ATTEMPTS
- RETRY_BASE_DELAY_MS
- HTTP_TIMEOUT_MS
- URBANEBOLT_* settings

The UrbaneBolt endpoint details are kept configurable so they can be updated easily if the provider docs change.

## API overview

### Create order
POST /api/v1/orders

Example request:

```json
{
  "courier_partner": "mockcourier",
  "order_id": "ORD-1001",
  "weight": 1.5,
  "payment_mode": "COD",
  "collectable_value": 999,
  "declared_value": 999,
  "item_description": "Bluetooth speaker",
  "service_type": "NDD",
  "dimensions": { "length": 20, "breadth": 15, "height": 10 },
  "consignee": {
    "name": "Rahul",
    "address": "123 Main Road",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411001",
    "mobile": "9876543210"
  },
  "shipper": {
    "name": "Acme",
    "address": "Industrial Area",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "mobile": "9876543211"
  }
}
```

### Track order
GET /api/v1/orders/{order_id}/track

### Cancel order
POST /api/v1/orders/{order_id}/cancel

### Bulk create
POST /api/v1/orders/bulk

This accepts up to 100 orders and returns a 202 response with a batchId. The work continues in the background so the request does not wait for all courier calls to finish.

Check status with:

GET /api/v1/orders/bulk/{batch_id}

### Error format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "fields": [
      { "field": "consignee.pincode", "message": "must be a 6 digit pincode" }
    ]
  },
  "requestId": "..."
}
```

The API does not expose courier-specific raw error details to the client.

## Idempotency

The orderId field is unique in MongoDB. If the same order is submitted again, the app returns the existing order instead of creating a duplicate shipment.

This matters because in a real system, two requests could hit at the same time. The database constraint is the final safety net.

## Retry and auth handling

- 4xx courier errors are not retried.
- 5xx, network, and timeout failures retry with backoff.
- 401 and 403 errors trigger a token refresh and one retry attempt.
- If retries are exhausted, the order is marked as failed and the normalized error is recorded.

## Bulk processing

The app creates a batch record immediately and processes items in the background using a limited worker pool.

This keeps the API responsive and prevents one request from spawning too many courier calls at once. In production, a queue like SQS, RabbitMQ, or BullMQ would be a better long-term setup.

## Testing

```bash
npm test
npm run typecheck
```

The current tests cover retry behavior and the courier registry. A production-ready version would also include MongoDB integration tests and API contract tests.

## Security

- Keep credentials in env variables.
- Store raw courier payloads for audit purposes if needed.
- Do not leak raw courier errors to clients.
- Add rate limiting and authentication before production use.

## Submission checklist

- Shared create, track, and cancel API
- Common normalized order model
- UrbaneBolt adapter
- Mock courier adapter
- Adapter and registry pattern
- Order persistence
- Tracking history
- Raw request and response audit storage
- Idempotent order creation
- Bulk processing up to 100 orders
- Concurrent background work
- Partial success handling
- Validation errors
- Unsupported courier handling
- Retry and backoff logic
- Auth refresh and retry
- Config-driven settings
- README and design notes
- Example curl/Postman usage
