import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import type { VendorPoStatus } from "@/lib/types/database";

const OPEN_STATUSES: VendorPoStatus[] = [
  "draft",
  "sent",
  "confirmed",
  "backordered",
  "partially_shipped",
  "shipped",
];

export default async function ReportsPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: openPos },
    { data: latePos },
    { data: vendorRows },
    { data: backordered },
    { data: financials },
  ] = await Promise.all([
    supabase
      .from("vendor_purchase_orders")
      .select("id, po_number, status, requested_ship_date, vendors(name)")
      .in("status", OPEN_STATUSES)
      .order("requested_ship_date", { ascending: true }),
    supabase
      .from("vendor_purchase_orders")
      .select("id, po_number, status, requested_ship_date, vendors(name)")
      .lt("requested_ship_date", today)
      .in("status", ["draft", "sent", "confirmed", "backordered"])
      .order("requested_ship_date", { ascending: true }),
    supabase
      .from("vendor_purchase_orders")
      .select("vendor_id, status, created_at, vendors(name)"),
    supabase
      .from("vendor_purchase_order_items")
      .select("id, sku, description, quantity, vendor_po_id, status")
      .eq("status", "backordered"),
    supabase
      .from("order_financials")
      .select("*")
      .order("gross_margin", { ascending: false })
      .limit(50),
  ]);

  // Orders by vendor.
  const byVendor = new Map<string, { name: string; total: number; open: number }>();
  for (const r of vendorRows ?? []) {
    const name = (r as { vendors?: { name?: string } }).vendors?.name ?? "Unknown";
    const key = r.vendor_id;
    const entry = byVendor.get(key) ?? { name, total: 0, open: 0 };
    entry.total += 1;
    if (OPEN_STATUSES.includes(r.status)) entry.open += 1;
    byVendor.set(key, entry);
  }
  const vendorReport = Array.from(byVendor.values()).sort(
    (a, b) => b.total - a.total,
  );

  // Monthly dropship volume (by created month).
  const byMonth = new Map<string, number>();
  for (const r of vendorRows ?? []) {
    const month = r.created_at.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
  }
  const monthly = Array.from(byMonth.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 12);
  const maxMonth = Math.max(1, ...monthly.map(([, v]) => v));

  return (
    <>
      <PageHeader
        title="Reports"
        description="Operational and financial snapshots of dropship activity."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Orders by vendor
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendorReport.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      No data.
                    </TableCell>
                  </TableRow>
                ) : (
                  vendorReport.map((v) => (
                    <TableRow key={v.name}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{v.open}</TableCell>
                      <TableCell className="text-right tabular-nums">{v.total}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Monthly dropship volume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {monthly.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data.</p>
            ) : (
              monthly.map(([month, count]) => (
                <div key={month} className="flex items-center gap-3 text-sm">
                  <span className="w-16 text-muted-foreground">{month}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded bg-secondary">
                    <div
                      className="h-full rounded bg-primary"
                      style={{ width: `${(count / maxMonth) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right tabular-nums">{count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm">
            Open dropship orders ({openPos?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <ReportPoTable rows={openPos ?? []} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm">
            Late vendor orders ({latePos?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <ReportPoTable rows={latePos ?? []} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm">
            Backordered items ({backordered?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {backordered && backordered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>PO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backordered.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">{it.sku ?? "-"}</TableCell>
                    <TableCell>{it.description ?? "-"}</TableCell>
                    <TableCell className="text-right tabular-nums">{it.quantity}</TableCell>
                    <TableCell>
                      <Link
                        href={`/purchase-orders/${it.vendor_po_id}`}
                        className="text-primary hover:underline"
                      >
                        View PO
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              No backordered items.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm">Gross margin by order</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {financials && financials.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Gross margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financials.map((f) => (
                  <TableRow key={f.customer_order_id}>
                    <TableCell>
                      <Link
                        href={`/orders/${f.customer_order_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {f.order_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(f.total_revenue)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(f.total_cost)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(f.gross_margin)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="px-5 py-6 text-sm text-muted-foreground">No orders yet.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function ReportPoTable({
  rows,
}: {
  rows: {
    id: string;
    po_number: string;
    status: VendorPoStatus;
    requested_ship_date: string | null;
    vendors?: { name?: string } | null;
  }[];
}) {
  if (rows.length === 0) {
    return (
      <p className="px-5 py-6 text-sm text-muted-foreground">No orders.</p>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>PO #</TableHead>
          <TableHead>Vendor</TableHead>
          <TableHead>Requested ship</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((po) => (
          <TableRow key={po.id}>
            <TableCell>
              <Link
                href={`/purchase-orders/${po.id}`}
                className="font-medium text-primary hover:underline"
              >
                {po.po_number}
              </Link>
            </TableCell>
            <TableCell>
              {(po as { vendors?: { name?: string } }).vendors?.name ?? "-"}
            </TableCell>
            <TableCell>{formatDate(po.requested_ship_date)}</TableCell>
            <TableCell>
              <VendorPoStatusBadge status={po.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
