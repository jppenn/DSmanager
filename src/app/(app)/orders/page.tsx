import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { CustomerOrderStatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CUSTOMER_ORDER_STATUSES, CUSTOMER_ORDER_STATUS_META } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Plus, ShoppingCart } from "lucide-react";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    customer?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .order("name");

  let query = supabase
    .from("customer_orders")
    .select("*, customers(name)")
    .order("created_at", { ascending: false });

  if (sp.q) {
    query = query.or(
      `order_number.ilike.%${sp.q}%,customer_po_number.ilike.%${sp.q}%,salesperson.ilike.%${sp.q}%`,
    );
  }
  if (sp.status)
    query = query.eq("status", sp.status as (typeof CUSTOMER_ORDER_STATUSES)[number]);
  if (sp.customer) query = query.eq("customer_id", sp.customer);
  if (sp.from) query = query.gte("requested_ship_date", sp.from);
  if (sp.to) query = query.lte("requested_ship_date", sp.to);

  const { data: orders } = await query;

  return (
    <>
      <PageHeader
        title="Customer Orders"
        description="Orders placed by customers and fulfilled through dropship vendors."
        actions={
          <Link href="/orders/new" className={buttonVariants()}>
            <Plus className="size-4" /> New order
          </Link>
        }
      />

      <Card className="p-4">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            name="q"
            defaultValue={sp.q}
            placeholder="Order #, PO #, salesperson"
            className="lg:col-span-2"
          />
          <Select name="status" defaultValue={sp.status ?? ""}>
            <option value="">All statuses</option>
            {CUSTOMER_ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CUSTOMER_ORDER_STATUS_META[s].label}
              </option>
            ))}
          </Select>
          <Select name="customer" defaultValue={sp.customer ?? ""}>
            <option value="">All customers</option>
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Filter
            </Button>
            <Link
              href="/orders"
              className={buttonVariants({ variant: "outline" })}
            >
              Reset
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm lg:col-span-2">
            <span className="text-muted-foreground">Ship date</span>
            <Input type="date" name="from" defaultValue={sp.from} />
            <span className="text-muted-foreground">to</span>
            <Input type="date" name="to" defaultValue={sp.to} />
          </div>
        </form>
      </Card>

      {!orders || orders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No orders found"
          description="Create your first customer order to get started."
          action={
            <Link href="/orders/new" className={buttonVariants()}>
              <Plus className="size-4" /> New order
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Salesperson</TableHead>
                <TableHead>Requested ship</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => {
                const customer = (o as { customers?: { name?: string } }).customers;
                return (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link
                        href={`/orders/${o.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {o.order_number}
                      </Link>
                    </TableCell>
                    <TableCell>{customer?.name ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.salesperson ?? "-"}
                    </TableCell>
                    <TableCell>{formatDate(o.requested_ship_date)}</TableCell>
                    <TableCell>
                      <CustomerOrderStatusBadge status={o.status} />
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
