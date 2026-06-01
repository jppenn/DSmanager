"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { shipmentSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import type { DeliveryStatus } from "@/lib/types/database";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Propagates tracking / ship date info from a PO down to the linked customer
 * order line items so the customer-facing order stays in sync.
 */
async function syncTrackingToOrderItems(
  poId: string,
  tracking: string | null,
  shipDate: string | null,
  estDelivery: string | null,
) {
  const supabase = await createClient();
  const { data: poItems } = await supabase
    .from("vendor_purchase_order_items")
    .select("customer_order_item_id")
    .eq("vendor_po_id", poId);

  const coItemIds = (poItems ?? [])
    .map((r) => r.customer_order_item_id)
    .filter((v): v is string => Boolean(v));

  if (coItemIds.length === 0) return;

  await supabase
    .from("customer_order_items")
    .update({
      tracking_number: tracking,
      ship_date: shipDate,
      est_delivery_date: estDelivery,
    })
    .in("id", coItemIds);
}

export async function saveShipment(
  poId: string,
  shipmentId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = shipmentSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? "form")] = issue.message;
    }
    return { fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const values = parsed.data;
  const isDelivered = values.delivery_status === "delivered";
  const payload = {
    vendor_po_id: poId,
    carrier: values.carrier,
    tracking_number: values.tracking_number,
    est_ship_date: values.est_ship_date,
    actual_ship_date: values.actual_ship_date,
    est_delivery_date: values.est_delivery_date,
    delivery_status: values.delivery_status,
    notes: values.notes,
    delivered_at: isDelivered ? new Date().toISOString() : null,
  };

  if (shipmentId) {
    const { error } = await supabase
      .from("shipments")
      .update(payload)
      .eq("id", shipmentId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("shipments")
      .insert({ ...payload, created_by: user?.id });
    if (error) return { error: error.message };
  }

  await syncTrackingToOrderItems(
    poId,
    values.tracking_number,
    values.actual_ship_date,
    values.est_delivery_date,
  );

  await logAudit(
    {
      entityType: "vendor_purchase_order",
      entityId: poId,
      actorId: user?.id ?? null,
      action: "tracking_updated",
      metadata: {
        carrier: values.carrier,
        tracking_number: values.tracking_number,
        delivery_status: values.delivery_status,
      },
    },
    supabase,
  );

  // Reflect delivery on the PO status when delivered.
  if (isDelivered) {
    await supabase
      .from("vendor_purchase_orders")
      .update({ status: "delivered" as const })
      .eq("id", poId);
  } else if (values.actual_ship_date) {
    await supabase
      .from("vendor_purchase_orders")
      .update({ status: "shipped" as const })
      .eq("id", poId);
  }

  revalidatePath(`/purchase-orders/${poId}`);
  revalidatePath(`/portal/${poId}`);
  return {};
}

export async function uploadPod(
  poId: string,
  shipmentId: string,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${poId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("pod")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase
    .from("shipments")
    .update({ pod_file_path: path })
    .eq("id", shipmentId);

  if (error) return { error: error.message };

  await logAudit(
    {
      entityType: "vendor_purchase_order",
      entityId: poId,
      actorId: user?.id ?? null,
      action: "shipment_updated",
      metadata: { pod_uploaded: true },
    },
    supabase,
  );

  revalidatePath(`/purchase-orders/${poId}`);
  revalidatePath(`/portal/${poId}`);
  return { success: "Proof of delivery uploaded." };
}

export async function getPodSignedUrl(
  path: string,
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("pod")
    .createSignedUrl(path, 60 * 10);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}

export type { DeliveryStatus };
