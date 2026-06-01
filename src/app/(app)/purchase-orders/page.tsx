import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { VendorPoStatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VENDOR_PO_STATUSES, VENDOR_PO_STATUS_META } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Truck } from "lucide-react";

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    vendor?: string;
    sku?: string;
    tracking?: string;
  }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, name")
    .order("name");

  // SKU / tracking searches resolve to a set of PO ids first.
  let restrictIds: string[] | null = null;
  if (sp.sku) {
    const { data } = await supabase
      .from("vendor_purchase_order_items")
      .select("vendor_po_id")
      .ilike("sku", `%${sp.sku}%`);
    restrictIds = (data ?? []).map((r) => r.vendor_po_id);
  }
  if (sp.tracking) {
    const { data } = await supabase
      .from("shipments")
      .select("vendor_po_id")
      .ilike("tracking_number", `%${sp.tracking}%`);
    const ids = (data ?? []).map((r) => r.vendor_po_id);
    restrictIds = restrictIds ? restrictIds.filter((i) => ids.includes(i)) : ids;
  }

  let query = supabase
    .from("vendor_purchase_orders")
    .select("*, vendors(name), customer_orders(order_number)")
    .order("created_at", { ascending: false });

  if (sp.q) query = query.ilike("po_number", `%${sp.q}%`);
  if (sp.status)
    query = query.eq("status", sp.status as (typeof VENDOR_PO_STATUSES)[number]);
  if (sp.vendor) query = query.eq("vendor_id", sp.vendor);
  if (restrictIds) {
    if (restrictIds.length === 0) query = query.eq("id", "00000000-0000-0000-0000-000000000000");
    else query = query.in("id", restrictIds);
  }

  const { data: pos } = await query;

  return (
    <>
      <PageHeader
        title="Vendor Purchase Orders"
        description="Dropship POs sent to vendors for fulfillment."
      />

      <Card className="p-4">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Input name="q" defaultValue={sp.q} placeholder="PO number" />
          <Input name="sku" defaultValue={sp.sku} placeholder="SKU" />
          <Input name="tracking" defaultValue={sp.tracking} placeholder="Tracking #" />
          <Select name="status" defaultValue={sp.status ?? ""}>
            <option value="">All statuses</option>
            {VENDOR_PO_STATUSES.map((s) => (
              <option key={s} value={s}>
                {VENDOR_PO_STATUS_META[s].label}
              </option>
            ))}
          </Select>
          <Select name="vendor" defaultValue={sp.vendor ?? ""}>
            <option value="">All vendors</option>
            {vendors?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Filter
            </Button>
            <Link href="/purchase-orders" className={buttonVariants({ variant: "outline" })}>
              Reset
            </Link>
          </div>
        </form>
      </Card>

      {!pos || pos.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No purchase orders found"
          description="Create a vendor PO from a customer order to dropship line items."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Requested ship</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pos.map((po) => {
                const vendor = (po as { vendors?: { name?: string } }).vendors;
                const order = (po as { customer_orders?: { order_number?: string } })
                  .customer_orders;
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
                    <TableCell className="text-muted-foreground">
                      {order?.order_number ?? "-"}
                    </TableCell>
                    <TableCell>{formatDate(po.requested_ship_date)}</TableCell>
                    <TableCell>
                      <VendorPoStatusBadge status={po.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
