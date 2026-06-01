import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "../../product-form";
import { updateProduct } from "../../actions";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireInternal();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: vendors }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("vendors").select("id, name").eq("is_active", true).order("name"),
  ]);

  if (!product) notFound();

  return (
    <>
      <PageHeader
        title="Edit product"
        description={product.internal_part_number ?? product.sku ?? "Product"}
      />
      <ProductForm
        product={product}
        vendors={vendors ?? []}
        action={updateProduct.bind(null, id)}
      />
    </>
  );
}
