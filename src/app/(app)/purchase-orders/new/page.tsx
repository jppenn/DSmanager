import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { PoForm } from "../po-form";
import { createVendorPo } from "../actions";

export default async function NewPoPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  if (!orderId) redirect("/orders");

  const supabase = await createClient();
  const [{ data: order }, { data: vendors }, { data: items }] =
    await Promise.all([
      supabase.from("customer_orders").select("*").eq("id", orderId).single(),
      supabase
        .from("vendors")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("customer_order_items")
        .select("*")
        .eq("customer_order_id", orderId)
        .is("vendor_po_item_id", null)
        .order("created_at"),
    ]);

  if (!order) notFound();

  return (
    <>
      <PageHeader
        title="New vendor PO"
        description={`Dropship line items from order ${order.order_number}.`}
      />
      <PoForm
        order={order}
        vendors={vendors ?? []}
        availableItems={items ?? []}
        action={createVendorPo}
      />
    </>
  );
}
