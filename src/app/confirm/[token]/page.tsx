import { createAdminClient } from "@/lib/supabase/admin";
import { ConfirmButton } from "./confirm-button";
import { VendorPoStatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { Package } from "lucide-react";

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: po } = await supabase
    .from("vendor_purchase_orders")
    .select("*, vendors(name), vendor_purchase_order_items(*)")
    .eq("confirm_token", token)
    .single();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary to-background px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Package className="size-6" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Purchase Order Confirmation
          </h1>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {!po ? (
            <p className="text-center text-sm text-muted-foreground">
              This confirmation link is invalid or has expired. Please contact
              your buyer for assistance.
            </p>
          ) : (
            <ConfirmedContent po={po} token={token} />
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmedContent({
  po,
  token,
}: {
  po: {
    po_number: string;
    status:
      | "draft"
      | "sent"
      | "confirmed"
      | "backordered"
      | "partially_shipped"
      | "shipped"
      | "delivered"
      | "cancelled";
    confirmed_at: string | null;
    requested_ship_date: string | null;
    special_instructions: string | null;
    ship_to_line1: string | null;
    ship_to_line2: string | null;
    ship_to_city: string | null;
    ship_to_state: string | null;
    ship_to_postal_code: string | null;
    vendors?: { name?: string } | null;
    vendor_purchase_order_items?: {
      id: string;
      sku: string | null;
      description: string | null;
      quantity: number;
    }[];
  };
  token: string;
}) {
  const items = po.vendor_purchase_order_items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">{po.po_number}</div>
          <div className="text-sm text-muted-foreground">
            For {po.vendors?.name ?? "your company"}
          </div>
        </div>
        <VendorPoStatusBadge status={po.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            Ship to
          </h3>
          <address className="mt-1 not-italic text-sm">
            {po.ship_to_line1}
            <br />
            {po.ship_to_line2 && (
              <>
                {po.ship_to_line2}
                <br />
              </>
            )}
            {[po.ship_to_city, po.ship_to_state].filter(Boolean).join(", ")}{" "}
            {po.ship_to_postal_code}
          </address>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            Requested ship date
          </h3>
          <p className="mt-1 text-sm">{formatDate(po.requested_ship_date)}</p>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          Line items
        </h3>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-2">SKU</th>
                <th className="p-2">Description</th>
                <th className="p-2 text-right">Qty</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-border">
                  <td className="p-2 font-medium">{it.sku ?? "-"}</td>
                  <td className="p-2">{it.description ?? "-"}</td>
                  <td className="p-2 text-right tabular-nums">{it.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {po.special_instructions && (
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            Special instructions
          </h3>
          <p className="mt-1 text-sm">{po.special_instructions}</p>
        </div>
      )}

      <ConfirmButton token={token} alreadyConfirmed={Boolean(po.confirmed_at)} />
    </div>
  );
}
