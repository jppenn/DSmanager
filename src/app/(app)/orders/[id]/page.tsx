import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTimeline } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CustomerOrderStatusBadge,
  VendorPoStatusBadge,
} from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuditTimeline } from "@/components/audit-timeline";
import { NotesSection } from "@/components/notes-section";
import { addOrderNote } from "../actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pencil, Truck } from "lucide-react";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("customer_orders")
    .select("*, customers(*)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const [{ data: items }, { data: pos }, timeline] = await Promise.all([
    supabase
      .from("customer_order_items")
      .select("*")
      .eq("customer_order_id", id)
      .order("created_at"),
    supabase
      .from("vendor_purchase_orders")
      .select("*, vendors(name)")
      .eq("customer_order_id", id)
      .order("created_at", { ascending: false }),
    getTimeline("customer_order", id),
  ]);

  const customer = (order as { customers?: { name?: string } }).customers;
  const itemRows = items ?? [];
  const totals = itemRows.reduce(
    (acc, it) => {
      acc.revenue += (it.sell_price ?? 0) * it.quantity;
      acc.cost += (it.unit_cost ?? 0) * it.quantity;
      return acc;
    },
    { revenue: 0, cost: 0 },
  );
  const noteAction = addOrderNote.bind(null, id);

  return (
    <>
      <PageHeader
        title={order.order_number}
        description={customer?.name ?? undefined}
        actions={
          <div className="flex gap-2">
            <Link
              href={`/orders/${id}/edit`}
              className={buttonVariants({ variant: "outline" })}
            >
              <Pencil className="size-4" /> Edit
            </Link>
            <Link
              href={`/purchase-orders/new?order=${id}`}
              className={buttonVariants()}
            >
              <Truck className="size-4" /> Create vendor PO
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <CustomerOrderStatusBadge status={order.status} />
        <span className="text-sm text-muted-foreground">
          Requested ship: {formatDate(order.requested_ship_date)}
        </span>
        {order.customer_po_number && (
          <span className="text-sm text-muted-foreground">
            Customer PO: {order.customer_po_number}
          </span>
        )}
        {order.salesperson && (
          <span className="text-sm text-muted-foreground">
            Salesperson: {order.salesperson}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm">Line items</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Revenue {formatCurrency(totals.revenue)} &middot; Margin{" "}
                  {formatCurrency(totals.revenue - totals.cost)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {itemRows.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted-foreground">
                  No line items.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit cost</TableHead>
                      <TableHead className="text-right">Sell</TableHead>
                      <TableHead>Tracking</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemRows.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell className="font-medium">{it.sku ?? "-"}</TableCell>
                        <TableCell>{it.description ?? "-"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {it.quantity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(it.unit_cost)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(it.sell_price)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {it.tracking_number ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm">
                Vendor purchase orders ({pos?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {pos && pos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO #</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested ship</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pos.map((po) => {
                      const vendor = (po as { vendors?: { name?: string } }).vendors;
                      return (
                        <TableRow key={po.id}>
                          <TableCell>
                            <Link
                              href={`/purchase-orders/${po.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {po.po_number}
                            </Link>
                          </TableCell>
                          <TableCell>{vendor?.name ?? "-"}</TableCell>
                          <TableCell>
                            <VendorPoStatusBadge status={po.status} />
                          </TableCell>
                          <TableCell>{formatDate(po.requested_ship_date)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="px-5 py-6 text-sm text-muted-foreground">
                  No vendor POs yet. Create one to dropship these items.
                </p>
              )}
            </CardContent>
          </Card>

          {order.internal_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Internal notes</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
                {order.internal_notes}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ship-to</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <address className="not-italic">
                {order.ship_to_line1 ?? customer?.name}
                <br />
                {order.ship_to_line2 && (
                  <>
                    {order.ship_to_line2}
                    <br />
                  </>
                )}
                {[order.ship_to_city, order.ship_to_state]
                  .filter(Boolean)
                  .join(", ")}{" "}
                {order.ship_to_postal_code}
              </address>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <NotesSection
                notes={timeline.notes}
                authorNames={timeline.actorNames}
                action={noteAction}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditTimeline
                events={timeline.events}
                actorNames={timeline.actorNames}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
