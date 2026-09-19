# curl examples

Start the API first:

```bash
curl http://localhost:3000/health
```

## Create MockCourier shipment

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "x-request-id: demo-001" \
  -d '{
    "courier_partner":"mockcourier",
    "order_id":"ORD-1001",
    "weight":1.5,
    "payment_mode":"COD",
    "collectable_value":999,
    "declared_value":999,
    "item_description":"Bluetooth speaker",
    "service_type":"NDD",
    "dimensions":{"length":20,"breadth":15,"height":10},
    "consignee":{"name":"John","address":"123 Main Road","city":"Pune","state":"Maharashtra","pincode":"411001","mobile":"9876543210"},
    "shipper":{"name":"Acme","address":"Industrial Area","city":"Mumbai","state":"Maharashtra","pincode":"400001","mobile":"9876543211"}
  }'
```

## Track

```bash
curl http://localhost:3000/api/v1/orders/ORD-1001/track
```

## Cancel

```bash
curl -X POST http://localhost:3000/api/v1/orders/ORD-1001/cancel
```

## Bulk

```bash
curl -X POST http://localhost:3000/api/v1/orders/bulk \
  -H "Content-Type: application/json" \
  -d '{"orders":[
    {
      "courier_partner":"mockcourier",
      "order_id":"BULK-001",
      "weight":1,
      "payment_mode":"PREPAID",
      "collectable_value":0,
      "declared_value":500,
      "item_description":"Book",
      "dimensions":{"length":20,"breadth":15,"height":5},
      "consignee":{"name":"A","address":"Road 1","city":"Pune","state":"Maharashtra","pincode":"411001","mobile":"9876543210"},
      "shipper":{"name":"Acme","address":"Road 2","city":"Mumbai","state":"Maharashtra","pincode":"400001","mobile":"9876543211"}
    },
    {
      "courier_partner":"mockcourier",
      "order_id":"BULK-002",
      "weight":2,
      "payment_mode":"COD",
      "collectable_value":1000,
      "declared_value":1000,
      "item_description":"Headphones",
      "dimensions":{"length":25,"breadth":18,"height":8},
      "consignee":{"name":"B","address":"Road 3","city":"Pune","state":"Maharashtra","pincode":"411002","mobile":"9876543212"},
      "shipper":{"name":"Acme","address":"Road 2","city":"Mumbai","state":"Maharashtra","pincode":"400001","mobile":"9876543211"}
    }
  ]}'
```

Then poll:

```bash
curl http://localhost:3000/api/v1/orders/bulk/<batch_id>
```

## Validation example

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{"courier_partner":"unknown","order_id":""}'
```
