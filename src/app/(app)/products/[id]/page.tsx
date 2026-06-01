import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Pencil } from "lucide-react";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, vendors(id, name)")
    .eq("id", id)
    .single();

  if (!product) notFound();

  const margin =
    product.sell_price != null && product.unit_cost != null
      ? product.sell_price - product.unit_cost
      : null;
  const marginPct =
    margin != null && product.sell_price
      ? (margin / product.sell_price) * 100
      : null;

  return (
    <>
      <PageHeader
        title={product.internal_part_number ?? product.sku ?? "Product"}
        description={product.description ?? undefined}
        actions={
          <Link
            href={`/products/${id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            <Pencil className="size-4" /> Edit
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Identification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>
              Our part #:{" "}
              <span className="font-medium">{product.internal_part_number ?? "-"}</span>
            </div>
            <div className="text-muted-foreground">SKU: {product.sku ?? "-"}</div>
            <div className="text-muted-foreground">UOM: {product.uom ?? "-"}</div>
            <Badge color={product.is_active ? "green" : "gray"}>
              {product.is_active ? "Active" : "Inactive"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vendor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <div>
              {product.vendors ? (
                <Link
                  href={`/vendors/${product.vendors.id}`}
                  className="text-primary hover:underline"
                >
                  {product.vendors.name}
                </Link>
              ) : (
                "-"
              )}
            </div>
            <div>Vendor part #: {product.vendor_part_number ?? "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <div>
              Our cost:{" "}
              {product.unit_cost != null ? formatCurrency(product.unit_cost) : "-"}
            </div>
            <div>
              Customer price:{" "}
              {product.sell_price != null ? formatCurrency(product.sell_price) : "-"}
            </div>
            <div>
              Margin:{" "}
              {margin != null ? (
                <span>
                  {formatCurrency(margin)}
                  {marginPct != null && ` (${marginPct.toFixed(1)}%)`}
                </span>
              ) : (
                "-"
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {product.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
            {product.notes}
          </CardContent>
        </Card>
      )}
    </>
  );
}
