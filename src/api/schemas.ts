import { z } from "zod";

const address = z.object({
  name: z.string().min(1),
  address: z.string().min(3),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/, "must be a 6 digit pincode"),
  mobile: z.string().regex(/^\d{10}$/, "must be a 10 digit mobile number"),
  email: z.string().email().optional()
});

export const orderSchema = z.object({
  courier_partner: z.string().min(1),
  order_id: z.string().min(1).max(100),
  weight: z.number().positive(),
  payment_mode: z.enum(["PREPAID", "COD"]),
  collectable_value: z.number().nonnegative(),
  declared_value: z.number().nonnegative(),
  item_description: z.string().min(1),
  service_type: z.string().optional(),
  dimensions: z.object({
    length: z.number().positive(),
    breadth: z.number().positive(),
    height: z.number().positive()
  }),
  consignee: address,
  shipper: address
});

export const bulkSchema = z.object({
  orders: z.array(orderSchema).min(1).max(100)
});
