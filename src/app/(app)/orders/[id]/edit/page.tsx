import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { OrderForm } from "../../order-form";
import { updateOrder } from "../../actions";
import type { EditableItem } from "../../line-items-editor";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: customers }, { data: items }] =
    await Promise.all([
      supabase.from("customer_orders").select("*").eq("id", id).single(),
      supabase.from("customers").select("id, name").order("name"),
      supabase
        .from("customer_order_items")
        .select("*")
        .eq("customer_order_id", id)
        .order("created_at"),
    ]);

  if (!order) notFound();

  const editableItems: EditableItem[] = (items ?? []).map((it) => ({
    id: it.id,
    sku: it.sku ?? "",
    description: it.description ?? "",
    quantity: it.quantity,
    unit_cost: it.unit_cost != null ? String(it.unit_cost) : "",
    sell_price: it.sell_price != null ? String(it.sell_price) : "",
    notes: it.notes ?? "",
  }));

  const action = updateOrder.bind(null, id);

  return (
    <>
      <PageHeader title={`Edit ${order.order_number}`} />
      <OrderForm
        customers={customers ?? []}
        order={order}
        items={editableItems}
        action={action}
      />
    </>
  );
}
