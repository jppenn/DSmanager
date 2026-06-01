"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/auth";
import { vendorPoSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import type { VendorPoStatus } from "@/lib/types/database";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseHeader(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return vendorPoSchema.safeParse(raw);
}

export async function createVendorPo(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireInternal();
  const header = parseHeader(formData);
  if (!header.success) return { fieldErrors: flatten(header.error) };

  const selectedItemIds = formData.getAll("item_ids").map(String);
  if (selectedItemIds.length === 0) {
    return { error: "Select at least one line item to include on the PO." };
  }

  const supabase = await createClient();

  // Pull the source customer order items to copy onto the PO.
  const { data: sourceItems } = await supabase
    .from("customer_order_items")
    .select("*")
    .in("id", selectedItemIds);

  if (!sourceItems || sourceItems.length === 0) {
    return { error: "Selected line items could not be found." };
  }

  const { data: po, error } = await supabase
    .from("vendor_purchase_orders")
    .insert({ ...header.data, created_by: user.id })
    .select("*")
    .single();

  if (error || !po) return { error: error?.message ?? "Failed to create PO." };

  for (const src of sourceItems) {
    const { data: poItem, error: itemErr } = await supabase
      .from("vendor_purchase_order_items")
      .insert({
        vendor_po_id: po.id,
        customer_order_item_id: src.id,
        sku: src.sku,
        description: src.description,
        quantity: src.quantity,
        unit_cost: src.unit_cost,
        status: po.status,
      })
      .select("id")
      .single();

    if (poItem) {
      await supabase
        .from("customer_order_items")
        .update({ vendor_po_item_id: poItem.id })
        .eq("id", src.id);
    }
    if (itemErr) return { error: itemErr.message };
  }

  await logAudit(
    {
      entityType: "vendor_purchase_order",
      entityId: po.id,
      actorId: user.id,
      action: "po_created",
      metadata: { po_number: po.po_number, item_count: sourceItems.length },
    },
    supabase,
  );

  revalidatePath("/purchase-orders");
  revalidatePath(`/orders/${po.customer_order_id}`);
  redirect(`/purchase-orders/${po.id}`);
}

export async function updateVendorPo(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireInternal();
  const header = parseHeader(formData);
  if (!header.success) return { fieldErrors: flatten(header.error) };

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("vendor_purchase_orders")
    .select("status")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("vendor_purchase_orders")
    .update(header.data)
    .eq("id", id);

  if (error) return { error: error.message };

  if (before && before.status !== header.data.status) {
    await logAudit(
      {
        entityType: "vendor_purchase_order",
        entityId: id,
        actorId: user.id,
        action: "status_changed",
        metadata: { from: before.status, to: header.data.status },
      },
      supabase,
    );
  }

  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${id}`);
  redirect(`/purchase-orders/${id}`);
}

/**
 * Lightweight status update used from the PO detail page (internal + vendor).
 */
export async function updatePoStatus(
  id: string,
  status: VendorPoStatus,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: before } = await supabase
    .from("vendor_purchase_orders")
    .select("status")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("vendor_purchase_orders")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit(
    {
      entityType: "vendor_purchase_order",
      entityId: id,
      actorId: user?.id ?? null,
      action: "status_changed",
      metadata: { from: before?.status, to: status },
    },
    supabase,
  );

  revalidatePath(`/purchase-orders/${id}`);
  revalidatePath(`/portal/${id}`);
  return {};
}

/**
 * Confirms a PO from within an authenticated session (vendor portal or staff).
 */
export async function confirmPo(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("vendor_purchase_orders")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit(
    {
      entityType: "vendor_purchase_order",
      entityId: id,
      actorId: user?.id ?? null,
      action: "vendor_confirmed",
      metadata: { via: "portal" },
    },
    supabase,
  );

  revalidatePath(`/purchase-orders/${id}`);
  revalidatePath(`/portal/${id}`);
  return {};
}

export async function addPoNote(
  poId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Note cannot be empty." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("order_notes").insert({
    entity_type: "vendor_purchase_order",
    entity_id: poId,
    body,
    author_id: user?.id ?? null,
  });
  await logAudit(
    {
      entityType: "vendor_purchase_order",
      entityId: poId,
      actorId: user?.id ?? null,
      action: "note_added",
    },
    supabase,
  );
  revalidatePath(`/purchase-orders/${poId}`);
  revalidatePath(`/portal/${poId}`);
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
