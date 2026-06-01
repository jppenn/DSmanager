import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTimeline } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VendorPoStatusBadge } from "@/components/ui/status-badge";
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
import { PoStatusControl } from "../po-status-control";
import { SendPoButton } from "../send-po-button";
import { ConfirmPoButton } from "../confirm-po-button";
import { ShipmentSection } from "../shipment-section";
import { addPoNote } from "../actions";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { Pencil } from "lucide-react";

export default async function PoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: po } = await supabase
    .from("vendor_purchase_orders")
    .select("*, vendors(name, email, contact_person), customer_orders(order_number, id)")
    .eq("id", id)
    .single();

  if (!po) notFound();

  const [{ data: items }, { data: shipments }, { data: emails }, timeline] =
    await Promise.all([
      supabase
        .from("vendor_purchase_order_items")
        .select("*")
        .eq("vendor_po_id", id)
        .order("created_at"),
      supabase
        .from("shipments")
        .select("*")
        .eq("vendor_po_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("email_logs")
        .select("*")
        .eq("vendor_po_id", id)
        .order("sent_at", { ascending: false }),
      getTimeline("vendor_purchase_order", id),
    ]);

  const vendor = (po as { vendors?: { name?: string; email?: string } }).vendors;
  const order = (
    po as { customer_orders?: { order_number?: string; id?: string } }
  ).customer_orders;
  const noteAction = addPoNote.bind(null, id);
  const totalCost = (items ?? []).reduce(
    (acc, it) => acc + (it.unit_cost ?? 0) * it.quantity,
    0,
  );

  return (
    <>
      <PageHeader
        title={po.po_number}
        description={vendor?.name ?? undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/purchase-orders/${id}/edit`}
              className={buttonVariants({ variant: "outline" })}
            >
              <Pencil className="size-4" /> Edit
            </Link>
            {!po.confirmed_at && <ConfirmPoButton poId={id} />}
            <SendPoButton poId={id} alreadySent={Boolean(po.sent_at)} />
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <PoStatusControl id={id} status={po.status} />
        {order?.order_number && order.id && (
          <Link
            href={`/orders/${order.id}`}
            className="text-sm text-primary hover:underline"
          >
            Order {order.order_number}
          </Link>
        )}
        {po.sent_at && (
          <span className="text-sm text-muted-foreground">
            Sent {formatDateTime(po.sent_at)}
          </span>
        )}
        {po.confirmed_at && (
          <span className="text-sm text-muted-foreground">
            Confirmed {formatDateTime(po.confirmed_at)}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm">Line items</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items ?? []).map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-medium">{it.sku ?? "-"}</TableCell>
                      <TableCell>{it.description ?? "-"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {it.quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(it.unit_cost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end border-t border-border px-5 py-3 text-sm">
                <span className="text-muted-foreground">
                  PO cost total:{" "}
                  <span className="font-medium text-foreground">
                    {formatCurrency(totalCost)}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Shipment tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <ShipmentSection poId={id} shipments={shipments ?? []} canEdit />
            </CardContent>
          </Card>

          {po.special_instructions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Special instructions</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
                {po.special_instructions}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Email history ({emails?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {emails && emails.length > 0 ? (
                emails.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                  >
                    <span>
                      {e.subject}{" "}
                      <span className="text-muted-foreground">
                        &rarr; {e.to_email}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {e.status} &middot; {formatDateTime(e.sent_at)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No emails sent yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vendor &amp; ship-to</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="font-medium">{vendor?.name}</div>
                <div className="text-muted-foreground">{vendor?.email ?? "-"}</div>
              </div>
              <div className="text-muted-foreground">
                <address className="not-italic">
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
              <div className="text-muted-foreground">
                Requested ship: {formatDate(po.requested_ship_date)}
              </div>
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
