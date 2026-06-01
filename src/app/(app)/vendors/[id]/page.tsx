import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
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
import { formatDate } from "@/lib/utils";
import { Pencil } from "lucide-react";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", id)
    .single();

  if (!vendor) notFound();

  const { data: pos } = await supabase
    .from("vendor_purchase_orders")
    .select("*")
    .eq("vendor_id", id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title={vendor.name}
        description={vendor.contact_person ?? undefined}
        actions={
          <Link href={`/vendors/${id}/edit`} className={buttonVariants({ variant: "outline" })}>
            <Pencil className="size-4" /> Edit
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>{vendor.contact_person ?? "-"}</div>
            <div className="text-muted-foreground">{vendor.email ?? "-"}</div>
            <div className="text-muted-foreground">{vendor.phone ?? "-"}</div>
            <Badge color={vendor.is_active ? "green" : "gray"}>
              {vendor.is_active ? "Active" : "Inactive"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <div>Payment: {vendor.payment_terms ?? "-"}</div>
            <div>
              Lead time:{" "}
              {vendor.lead_time_days != null ? `${vendor.lead_time_days} days` : "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
            {vendor.notes ?? "-"}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm">Purchase orders ({pos?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {pos && pos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO #</TableHead>
                  <TableHead>Requested ship</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pos.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <Link href={`/purchase-orders/${po.id}`} className="font-medium text-primary hover:underline">
                        {po.po_number}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(po.requested_ship_date)}</TableCell>
                    <TableCell>
                      <VendorPoStatusBadge status={po.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(po.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="px-5 py-6 text-sm text-muted-foreground">No purchase orders yet.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
