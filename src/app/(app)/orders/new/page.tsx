import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { OrderForm } from "../order-form";
import { createOrder } from "../actions";

export default async function NewOrderPage() {
  const supabase = await createClient();
  const [{ data: customers }, { data: products }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("products")
      .select("id, internal_part_number, sku, description, unit_cost, sell_price")
      .eq("is_active", true)
      .order("internal_part_number", { nullsFirst: false }),
  ]);

  return (
    <>
      <PageHeader
        title="New customer order"
        description="Capture the order header and line items."
      />
      <OrderForm
        customers={customers ?? []}
        products={products ?? []}
        action={createOrder}
      />
    </>
  );
}
