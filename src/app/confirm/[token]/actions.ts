"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Confirms a PO via its public token. Uses the admin client because the
 * confirming vendor may follow the email link without an active session.
 */
export async function confirmPoByToken(
  token: string,
): Promise<{ error?: string; success?: boolean }> {
  if (!token) return { error: "Missing confirmation token." };

  const supabase = createAdminClient();

  const { data: po } = await supabase
    .from("vendor_purchase_orders")
    .select("id, status, confirmed_at")
    .eq("confirm_token", token)
    .single();

  if (!po) return { error: "This confirmation link is invalid or expired." };

  if (po.confirmed_at) return { success: true };

  const { error } = await supabase
    .from("vendor_purchase_orders")
    .update({
      status: "confirmed" as const,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", po.id);

  if (error) return { error: error.message };

  await supabase.from("audit_events").insert({
    entity_type: "vendor_purchase_order",
    entity_id: po.id,
    actor_id: null,
    action: "vendor_confirmed",
    metadata: { via: "email_link" },
  });

  return { success: true };
}
