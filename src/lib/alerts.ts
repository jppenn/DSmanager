import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, VendorPoStatus } from "@/lib/types/database";

export type AlertType =
  | "not_confirmed_24h"
  | "ship_date_passed"
  | "tracking_missing"
  | "partially_shipped"
  | "backordered"
  | "cancelled";

export type AlertSeverity = "high" | "medium" | "low";

export interface Alert {
  type: AlertType;
  severity: AlertSeverity;
  poId: string;
  poNumber: string;
  vendorName: string;
  message: string;
}

export const ALERT_META: Record<AlertType, { label: string }> = {
  not_confirmed_24h: { label: "Awaiting confirmation > 24h" },
  ship_date_passed: { label: "Ship date passed" },
  tracking_missing: { label: "Tracking missing" },
  partially_shipped: { label: "Partially shipped" },
  backordered: { label: "Backordered" },
  cancelled: { label: "Cancelled by vendor" },
};

const CLOSED: VendorPoStatus[] = ["delivered", "cancelled"];

interface PoForAlerts {
  id: string;
  po_number: string;
  status: VendorPoStatus;
  sent_at: string | null;
  confirmed_at: string | null;
  requested_ship_date: string | null;
  vendors: { name: string } | null;
}

/**
 * Evaluates all alert conditions across open vendor POs. Shared by the
 * dashboard (read-only display) and the cron route (notifications).
 */
export async function computeAlerts(
  supabase: SupabaseClient<Database>,
): Promise<Alert[]> {
  const { data: pos } = await supabase
    .from("vendor_purchase_orders")
    .select(
      "id, po_number, status, sent_at, confirmed_at, requested_ship_date, vendors(name)",
    )
    .order("created_at", { ascending: false });

  const list = (pos ?? []) as unknown as PoForAlerts[];
  if (list.length === 0) return [];

  // Track which POs have a shipment with a tracking number.
  const { data: shipments } = await supabase
    .from("shipments")
    .select("vendor_po_id, tracking_number");

  const hasTracking = new Set(
    (shipments ?? [])
      .filter((s) => s.tracking_number && s.tracking_number.trim() !== "")
      .map((s) => s.vendor_po_id),
  );

  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const alerts: Alert[] = [];

  for (const po of list) {
    const vendorName = po.vendors?.name ?? "Unknown vendor";
    const base = { poId: po.id, poNumber: po.po_number, vendorName };

    if (CLOSED.includes(po.status)) {
      if (po.status === "cancelled") {
        alerts.push({
          ...base,
          type: "cancelled",
          severity: "medium",
          message: `${po.po_number} was cancelled.`,
        });
      }
      continue;
    }

    if (
      po.status === "sent" &&
      !po.confirmed_at &&
      po.sent_at &&
      now - new Date(po.sent_at).getTime() > 24 * 60 * 60 * 1000
    ) {
      alerts.push({
        ...base,
        type: "not_confirmed_24h",
        severity: "high",
        message: `${po.po_number} has not been confirmed within 24 hours.`,
      });
    }

    if (
      po.requested_ship_date &&
      po.requested_ship_date < today &&
      !["shipped", "partially_shipped"].includes(po.status)
    ) {
      alerts.push({
        ...base,
        type: "ship_date_passed",
        severity: "high",
        message: `${po.po_number} is past its requested ship date.`,
      });
    }

    if (
      ["shipped", "partially_shipped"].includes(po.status) &&
      !hasTracking.has(po.id)
    ) {
      alerts.push({
        ...base,
        type: "tracking_missing",
        severity: "medium",
        message: `${po.po_number} is marked shipped but has no tracking number.`,
      });
    }

    if (po.status === "partially_shipped") {
      alerts.push({
        ...base,
        type: "partially_shipped",
        severity: "low",
        message: `${po.po_number} is only partially shipped.`,
      });
    }

    if (po.status === "backordered") {
      alerts.push({
        ...base,
        type: "backordered",
        severity: "medium",
        message: `${po.po_number} has backordered items.`,
      });
    }
  }

  const order: Record<AlertSeverity, number> = { high: 0, medium: 1, low: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}
