import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
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

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("vendor_purchase_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (sp.q) query = query.ilike("po_number", `%${sp.q}%`);
  if (sp.status)
    query = query.eq("status", sp.status as (typeof VENDOR_PO_STATUSES)[number]);

  const { data: pos } = await query;

  const awaiting = (pos ?? []).filter(
    (p) => p.status === "sent" && !p.confirmed_at,
  ).length;

  return (
    <>
      <PageHeader
        title="Your purchase orders"
        description={
          awaiting > 0
            ? `${awaiting} purchase order${awaiting === 1 ? "" : "s"} awaiting your confirmation.`
            : "Review and update the status of your dropship orders."
        }
      />

      <Card className="p-4">
        <form className="flex flex-wrap gap-3">
          <Input
            name="q"
            defaultValue={sp.q}
            placeholder="PO number"
            className="max-w-xs"
          />
          <Select name="status" defaultValue={sp.status ?? ""} className="max-w-xs">
            <option value="">All statuses</option>
            {VENDOR_PO_STATUSES.map((s) => (
              <option key={s} value={s}>
                {VENDOR_PO_STATUS_META[s].label}
              </option>
            ))}
          </Select>
          <Button type="submit">Filter</Button>
          <Link href="/portal" className={buttonVariants({ variant: "outline" })}>
            Reset
          </Link>
        </form>
      </Card>

      {!pos || pos.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No purchase orders"
          description="Purchase orders sent to you will appear here."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Requested ship</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confirmed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pos.map((po) => (
                <TableRow key={po.id}>
                  <TableCell>
                    <Link
                      href={`/portal/${po.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {po.po_number}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(po.requested_ship_date)}</TableCell>
                  <TableCell>
                    <VendorPoStatusBadge status={po.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {po.confirmed_at ? formatDate(po.confirmed_at) : "Pending"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
