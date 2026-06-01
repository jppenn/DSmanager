import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users } from "lucide-react";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select("*")
    .order("name", { ascending: true });

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,contact_name.ilike.%${q}%,contact_email.ilike.%${q}%`,
    );
  }

  const { data: customers } = await query;

  return (
    <>
      <PageHeader
        title="Customers"
        description="Companies you sell to and their default ship-to details."
        actions={
          <Link href="/customers/new" className={buttonVariants()}>
            <Plus className="size-4" /> New customer
          </Link>
        }
      />

      <form className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search customers..."
          className="pl-9"
        />
      </form>

      {!customers || customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description={q ? "Try a different search." : "Add your first customer to start creating orders."}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      href={`/customers/${c.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.contact_name ?? "-"}
                    {c.contact_email && (
                      <div className="text-xs">{c.contact_email}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {[c.ship_to_city, c.ship_to_state].filter(Boolean).join(", ") || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge color={c.is_active ? "green" : "gray"}>
                      {c.is_active ? "Active" : "Inactive"}
                    </Badge>
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
