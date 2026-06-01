import type {
  CustomerOrderStatus,
  VendorPoStatus,
  DeliveryStatus,
} from "@/lib/types/database";

export type BadgeColor =
  | "gray"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "purple"
  | "teal";

export const VENDOR_PO_STATUSES: VendorPoStatus[] = [
  "draft",
  "sent",
  "confirmed",
  "backordered",
  "partially_shipped",
  "shipped",
  "delivered",
  "cancelled",
];

export const VENDOR_PO_STATUS_META: Record<
  VendorPoStatus,
  { label: string; color: BadgeColor }
> = {
  draft: { label: "Draft", color: "gray" },
  sent: { label: "Sent to Vendor", color: "blue" },
  confirmed: { label: "Vendor Confirmed", color: "teal" },
  backordered: { label: "Backordered", color: "amber" },
  partially_shipped: { label: "Partially Shipped", color: "purple" },
  shipped: { label: "Shipped", color: "blue" },
  delivered: { label: "Delivered", color: "green" },
  cancelled: { label: "Cancelled", color: "red" },
};

export const CUSTOMER_ORDER_STATUSES: CustomerOrderStatus[] = [
  "draft",
  "open",
  "partially_shipped",
  "shipped",
  "completed",
  "cancelled",
];

export const CUSTOMER_ORDER_STATUS_META: Record<
  CustomerOrderStatus,
  { label: string; color: BadgeColor }
> = {
  draft: { label: "Draft", color: "gray" },
  open: { label: "Open", color: "blue" },
  partially_shipped: { label: "Partially Shipped", color: "purple" },
  shipped: { label: "Shipped", color: "teal" },
  completed: { label: "Completed", color: "green" },
  cancelled: { label: "Cancelled", color: "red" },
};

export const DELIVERY_STATUSES: DeliveryStatus[] = [
  "pending",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
];

export const DELIVERY_STATUS_META: Record<
  DeliveryStatus,
  { label: string; color: BadgeColor }
> = {
  pending: { label: "Pending", color: "gray" },
  in_transit: { label: "In Transit", color: "blue" },
  out_for_delivery: { label: "Out for Delivery", color: "purple" },
  delivered: { label: "Delivered", color: "green" },
  exception: { label: "Exception", color: "red" },
};

export const CARRIERS = [
  "UPS",
  "FedEx",
  "USPS",
  "DHL",
  "Freight / LTL",
  "Other",
];
