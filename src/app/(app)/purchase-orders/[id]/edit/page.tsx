import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { PoEditForm } from "../../po-edit-form";
import { updateVendorPo } from "../../actions";

export default async function EditPoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: po }, { data: vendors }] = await Promise.all([
    supabase.from("vendor_purchase_orders").select("*").eq("id", id).single(),
    supabase.from("vendors").select("id, name").order("name"),
  ]);

  if (!po) notFound();

  const action = updateVendorPo.bind(null, id);

  return (
    <>
      <PageHeader title={`Edit ${po.po_number}`} />
      <PoEditForm po={po} vendors={vendors ?? []} action={action} />
    </>
  );
}
