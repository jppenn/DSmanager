import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CustomerForm } from "../../customer-form";
import { updateCustomer } from "../../actions";

export default async function EditCustomerPage({
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

  const action = updateCustomer.bind(null, id);

  return (
    <>
      <PageHeader title={`Edit ${customer.name}`} />
      <CustomerForm customer={customer} action={action} />
    </>
  );
}
