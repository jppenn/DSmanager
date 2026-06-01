import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { OrderForm } from "../order-form";
import { createOrder } from "../actions";

export default async function NewOrderPage() {
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <>
      <PageHeader
        title="New customer order"
        description="Capture the order header and line items."
      />
      <OrderForm customers={customers ?? []} action={createOrder} />
    </>
  );
}
