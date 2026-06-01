import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "../product-form";
import { createProduct } from "../actions";

export default async function NewProductPage() {
  await requireInternal();
  const supabase = await createClient();
  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <>
      <PageHeader title="New product" description="Add a part to the catalog." />
      <ProductForm vendors={vendors ?? []} action={createProduct} />
    </>
  );
}
