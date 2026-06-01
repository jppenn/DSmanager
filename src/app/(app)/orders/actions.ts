"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/auth";
import { customerOrderSchema, orderItemSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

const itemsArraySchema = z.array(orderItemSchema);

function parseHeader(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return customerOrderSchema.safeParse(raw);
}

function parseItems(formData: FormData) {
  const json = String(formData.get("items_json") ?? "[]");
  try {
    return itemsArraySchema.safeParse(JSON.parse(json));
  } catch {
    return { success: false as const, error: null };
  }
}

export async function createOrder(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireInternal();
  const header = parseHeader(formData);
  if (!header.success) return { fieldErrors: flatten(header.error) };

  const items = parseItems(formData);
  const itemRows = items.success ? items.data : [];

  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("customer_orders")
    .insert({ ...header.data, created_by: user.id })
    .select("*")
    .single();

  if (error || !order) return { error: error?.message ?? "Failed to create order." };

  if (itemRows.length > 0) {
    const { error: itemErr } = await supabase.from("customer_order_items").insert(
      itemRows.map((it) => ({
        customer_order_id: order.id,
        sku: it.sku,
        description: it.description,
        quantity: it.quantity,
        unit_cost: it.unit_cost,
        sell_price: it.sell_price,
        notes: it.notes,
      })),
    );
    if (itemErr) return { error: itemErr.message };
  }

  await logAudit(
    {
      entityType: "customer_order",
      entityId: order.id,
      actorId: user.id,
      action: "order_created",
      metadata: { order_number: order.order_number, item_count: itemRows.length },
    },
    supabase,
  );

  revalidatePath("/orders");
  redirect(`/orders/${order.id}`);
}

export async function updateOrder(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireInternal();
  const header = parseHeader(formData);
  if (!header.success) return { fieldErrors: flatten(header.error) };

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("customer_orders")
    .select("status")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("customer_orders")
    .update(header.data)
    .eq("id", id);

  if (error) return { error: error.message };

  // Replace line items with the submitted set.
  const items = parseItems(formData);
  if (items.success) {
    const submitted = items.data;
    const keepIds = submitted.filter((i) => i.id).map((i) => i.id as string);

    // Delete removed items (only those not linked to a vendor PO item).
    let del = supabase
      .from("customer_order_items")
      .delete()
      .eq("customer_order_id", id);
    if (keepIds.length > 0) del = del.not("id", "in", `(${keepIds.join(",")})`);
    await del;

    for (const it of submitted) {
      const payload = {
        customer_order_id: id,
        sku: it.sku,
        description: it.description,
        quantity: it.quantity,
        unit_cost: it.unit_cost,
        sell_price: it.sell_price,
        notes: it.notes,
      };
      if (it.id) {
        await supabase.from("customer_order_items").update(payload).eq("id", it.id);
      } else {
        await supabase.from("customer_order_items").insert(payload);
      }
    }
  }

  if (before && before.status !== header.data.status) {
    await logAudit(
      {
        entityType: "customer_order",
        entityId: id,
        actorId: user.id,
        action: "status_changed",
        metadata: { from: before.status, to: header.data.status },
      },
      supabase,
    );
  }

  await logAudit(
    {
      entityType: "customer_order",
      entityId: id,
      actorId: user.id,
      action: "order_updated",
    },
    supabase,
  );

  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  redirect(`/orders/${id}`);
}

export async function addOrderNote(
  orderId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireInternal();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Note cannot be empty." };

  const supabase = await createClient();
  await supabase.from("order_notes").insert({
    entity_type: "customer_order",
    entity_id: orderId,
    body,
    author_id: user.id,
  });
  await logAudit(
    {
      entityType: "customer_order",
      entityId: orderId,
      actorId: user.id,
      action: "note_added",
    },
    supabase,
  );
  revalidatePath(`/orders/${orderId}`);
  return {};
}

function flatten(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
