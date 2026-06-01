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
import { formatCurrency } from "@/lib/utils";
import { Plus, Search, Package } from "lucide-react";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, vendors(name)")
    .order("internal_part_number", { nullsFirst: false });
  if (q) {
    query = query.or(
      `internal_part_number.ilike.%${q}%,sku.ilike.%${q}%,vendor_part_number.ilike.%${q}%,description.ilike.%${q}%`,
    );
  }
  const { data: products } = await query;

  return (
    <>
      <PageHeader
        title="Products"
        description="Catalog of parts with our and vendor part numbers, costs, and prices."
        actions={
          <Link href="/products/new" className={buttonVariants()}>
            <Plus className="size-4" /> New product
          </Link>
        }
      />

      <form className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search part #, SKU, description..."
          className="pl-9"
        />
      </form>

      {!products || products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description={q ? "Try a different search." : "Add a product to build your catalog."}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Our part #</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Our cost</TableHead>
                <TableHead className="text-right">Customer price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link
                      href={`/products/${p.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {p.internal_part_number ?? "-"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.sku ?? "-"}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {p.description ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.vendors?.name ?? "-"}
                    {p.vendor_part_number && (
                      <div className="text-xs">#{p.vendor_part_number}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {p.unit_cost != null ? formatCurrency(p.unit_cost) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.sell_price != null ? formatCurrency(p.sell_price) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge color={p.is_active ? "green" : "gray"}>
                      {p.is_active ? "Active" : "Inactive"}
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
