import { z } from "zod";
import {
  CUSTOMER_ORDER_STATUSES,
  VENDOR_PO_STATUSES,
  DELIVERY_STATUSES,
} from "@/lib/constants";
import type {
  CustomerOrderStatus,
  VendorPoStatus,
  DeliveryStatus,
} from "@/lib/types/database";

const customerOrderStatusEnum = z.enum(
  CUSTOMER_ORDER_STATUSES as [CustomerOrderStatus, ...CustomerOrderStatus[]],
);
const vendorPoStatusEnum = z.enum(
  VENDOR_PO_STATUSES as [VendorPoStatus, ...VendorPoStatus[]],
);
const deliveryStatusEnum = z.enum(
  DELIVERY_STATUSES as [DeliveryStatus, ...DeliveryStatus[]],
);

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? null : (v ?? null)));

const optionalNumber = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === "" || v === undefined || v === null) return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  });

const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  contact_name: optionalString,
  contact_email: optionalString,
  contact_phone: optionalString,
  ship_to_line1: optionalString,
  ship_to_line2: optionalString,
  ship_to_city: optionalString,
  ship_to_state: optionalString,
  ship_to_postal_code: optionalString,
  ship_to_country: optionalString,
  notes: optionalString,
  is_active: z.coerce.boolean().default(true),
});

export const vendorSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  contact_person: optionalString,
  email: optionalString,
  phone: optionalString,
  payment_terms: optionalString,
  lead_time_days: optionalNumber,
  notes: optionalString,
  is_active: z.coerce.boolean().default(true),
});

export const customerOrderSchema = z.object({
  customer_id: z.string().uuid("Select a customer"),
  customer_po_number: optionalString,
  salesperson: optionalString,
  requested_ship_date: optionalDate,
  ship_to_line1: optionalString,
  ship_to_line2: optionalString,
  ship_to_city: optionalString,
  ship_to_state: optionalString,
  ship_to_postal_code: optionalString,
  ship_to_country: optionalString,
  internal_notes: optionalString,
  status: customerOrderStatusEnum,
});

export const orderItemSchema = z.object({
  id: optionalString,
  sku: optionalString,
  description: optionalString,
  quantity: z.coerce.number().min(0, "Quantity must be >= 0").default(1),
  unit_cost: optionalNumber,
  sell_price: optionalNumber,
  notes: optionalString,
});

export const vendorPoSchema = z.object({
  vendor_id: z.string().uuid("Select a vendor"),
  customer_order_id: z.string().uuid("Select a customer order"),
  requested_ship_date: optionalDate,
  ship_to_line1: optionalString,
  ship_to_line2: optionalString,
  ship_to_city: optionalString,
  ship_to_state: optionalString,
  ship_to_postal_code: optionalString,
  ship_to_country: optionalString,
  special_instructions: optionalString,
  internal_notes: optionalString,
  status: vendorPoStatusEnum,
});

export const shipmentSchema = z.object({
  carrier: optionalString,
  tracking_number: optionalString,
  est_ship_date: optionalDate,
  actual_ship_date: optionalDate,
  est_delivery_date: optionalDate,
  delivery_status: deliveryStatusEnum,
  notes: optionalString,
});

export const noteSchema = z.object({
  body: z.string().trim().min(1, "Note cannot be empty"),
});
