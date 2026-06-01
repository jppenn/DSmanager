import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { VendorForm } from "../../vendor-form";
import { updateVendor } from "../../actions";

export default async function EditVendorPage({
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

  const action = updateVendor.bind(null, id);

  return (
    <>
      <PageHeader title={`Edit ${vendor.name}`} />
      <VendorForm vendor={vendor} action={action} />
    </>
  );
}
