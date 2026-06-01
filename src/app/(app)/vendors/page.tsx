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
import { Plus, Search, Building2 } from "lucide-react";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("vendors").select("*").order("name");
  if (q) {
    query = query.or(
      `name.ilike.%${q}%,contact_person.ilike.%${q}%,email.ilike.%${q}%`,
    );
  }
  const { data: vendors } = await query;

  return (
    <>
      <PageHeader
        title="Vendors"
        description="Dropship suppliers that fulfill purchase orders."
        actions={
          <Link href="/vendors/new" className={buttonVariants()}>
            <Plus className="size-4" /> New vendor
          </Link>
        }
      />

      <form className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={q} placeholder="Search vendors..." className="pl-9" />
      </form>

      {!vendors || vendors.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No vendors found"
          description={q ? "Try a different search." : "Add a vendor to start sending purchase orders."}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Terms</TableHead>
                <TableHead>Lead time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Link href={`/vendors/${v.id}`} className="font-medium text-primary hover:underline">
                      {v.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.contact_person ?? "-"}
                    {v.email && <div className="text-xs">{v.email}</div>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{v.payment_terms ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.lead_time_days != null ? `${v.lead_time_days} days` : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge color={v.is_active ? "green" : "gray"}>
                      {v.is_active ? "Active" : "Inactive"}
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
