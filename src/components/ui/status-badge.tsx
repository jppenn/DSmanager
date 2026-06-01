import { Badge } from "@/components/ui/badge";
import {
  VENDOR_PO_STATUS_META,
  CUSTOMER_ORDER_STATUS_META,
  DELIVERY_STATUS_META,
} from "@/lib/constants";
import type {
  VendorPoStatus,
  CustomerOrderStatus,
  DeliveryStatus,
} from "@/lib/types/database";

export function VendorPoStatusBadge({ status }: { status: VendorPoStatus }) {
  const meta = VENDOR_PO_STATUS_META[status];
  return <Badge color={meta.color}>{meta.label}</Badge>;
}

export function CustomerOrderStatusBadge({
  status,
}: {
  status: CustomerOrderStatus;
}) {
  const meta = CUSTOMER_ORDER_STATUS_META[status];
  return <Badge color={meta.color}>{meta.label}</Badge>;
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const meta = DELIVERY_STATUS_META[status];
  return <Badge color={meta.color}>{meta.label}</Badge>;
}
