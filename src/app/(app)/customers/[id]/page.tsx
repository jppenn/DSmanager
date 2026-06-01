import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerOrderStatusBadge } from "@/components/ui/status-badge";
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

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (!customer) notFound();

  const { data: orders } = await supabase
    .from("customer_orders")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title={customer.name}
        description={customer.contact_name ?? undefined}
        actions={
          <Link
            href={`/customers/${id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
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
            <div>{customer.contact_name ?? "-"}</div>
            <div className="text-muted-foreground">{customer.contact_email ?? "-"}</div>
            <div className="text-muted-foreground">{customer.contact_phone ?? "-"}</div>
            <Badge color={customer.is_active ? "green" : "gray"}>
              {customer.is_active ? "Active" : "Inactive"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Default ship-to</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {customer.ship_to_line1 ? (
              <address className="not-italic">
                {customer.ship_to_line1}
                <br />
                {customer.ship_to_line2 && (
                  <>
                    {customer.ship_to_line2}
                    <br />
                  </>
                )}
                {[customer.ship_to_city, customer.ship_to_state]
                  .filter(Boolean)
                  .join(", ")}{" "}
                {customer.ship_to_postal_code}
                <br />
                {customer.ship_to_country}
              </address>
            ) : (
              "No address on file"
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
            {customer.notes ?? "-"}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm">Orders ({orders?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {orders && orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Requested ship</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link
                        href={`/orders/${o.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {o.order_number}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(o.requested_ship_date)}</TableCell>
                    <TableCell>
                      <CustomerOrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(o.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              No orders yet.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
