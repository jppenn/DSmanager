import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireVendor } from "@/lib/auth";
import { getTimeline } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
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
import { PoStatusControl } from "@/app/(app)/purchase-orders/po-status-control";
import { ConfirmPoButton } from "@/app/(app)/purchase-orders/confirm-po-button";
import { ShipmentSection } from "@/app/(app)/purchase-orders/shipment-section";
import { addPoNote } from "@/app/(app)/purchase-orders/actions";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function PortalPoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireVendor();
  const supabase = await createClient();

  const { data: po } = await supabase
    .from("vendor_purchase_orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!po) notFound();

  const [{ data: items }, { data: shipments }, timeline] = await Promise.all([
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
    getTimeline("vendor_purchase_order", id),
  ]);

  const noteAction = addPoNote.bind(null, id);

  return (
    <>
      <PageHeader
        title={po.po_number}
        actions={!po.confirmed_at ? <ConfirmPoButton poId={id} /> : undefined}
      />

      <div className="flex flex-wrap items-center gap-3">
        <VendorPoStatusBadge status={po.status} />
        <span className="text-sm text-muted-foreground">
          Requested ship: {formatDate(po.requested_ship_date)}
        </span>
        {po.confirmed_at && (
          <span className="text-sm text-muted-foreground">
            Confirmed {formatDateTime(po.confirmed_at)}
          </span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Update status</CardTitle>
        </CardHeader>
        <CardContent>
          <PoStatusControl id={id} status={po.status} />
        </CardContent>
      </Card>

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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Shipment &amp; tracking</CardTitle>
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ship-to</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
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
