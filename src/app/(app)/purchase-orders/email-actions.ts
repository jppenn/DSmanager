"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getResend, getFromEmail } from "@/lib/email/resend";
import {
  buildPoEmailHtml,
  buildPoEmailText,
  buildPoEmailSubject,
} from "@/lib/email/po-template";

export async function sendPoToVendor(
  poId: string,
): Promise<{ error?: string; success?: string }> {
  const user = await requireInternal();
  const supabase = await createClient();

  const { data: po } = await supabase
    .from("vendor_purchase_orders")
    .select("*, vendors(name, contact_person, email)")
    .eq("id", poId)
    .single();

  if (!po) return { error: "Purchase order not found." };

  const vendor = (
    po as {
      vendors?: { name: string; contact_person: string | null; email: string | null };
    }
  ).vendors;

  if (!vendor?.email) {
    return { error: "This vendor has no email address on file." };
  }

  const { data: items } = await supabase
    .from("vendor_purchase_order_items")
    .select("*")
    .eq("vendor_po_id", poId)
    .order("created_at");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const confirmUrl = `${appUrl}/confirm/${po.confirm_token}`;

  const subject = buildPoEmailSubject(po);
  const html = buildPoEmailHtml({
    po,
    vendor: { name: vendor.name, contact_person: vendor.contact_person },
    items: items ?? [],
    confirmUrl,
  });
  const text = buildPoEmailText({
    po,
    vendor: { name: vendor.name, contact_person: vendor.contact_person },
    items: items ?? [],
    confirmUrl,
  });

  const resend = getResend();
  let resendId: string | null = null;
  let sendError: string | null = null;

  if (resend) {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: vendor.email,
      subject,
      html,
      text,
    });
    resendId = data?.id ?? null;
    sendError = error ? error.message : null;
  } else {
    // No API key configured (e.g. local dev). Log the attempt without sending.
    sendError = null;
  }

  await supabase.from("email_logs").insert({
    vendor_po_id: poId,
    to_email: vendor.email,
    subject,
    resend_id: resendId,
    status: sendError ? "failed" : "sent",
    error: sendError,
    payload: { confirm_url: confirmUrl, item_count: items?.length ?? 0 },
    sent_by: user.id,
  });

  if (sendError) return { error: `Email failed: ${sendError}` };

  // Advance the PO to "sent" if it was still a draft.
  await supabase
    .from("vendor_purchase_orders")
    .update({
      sent_at: new Date().toISOString(),
      ...(po.status === "draft" ? { status: "sent" as const } : {}),
    })
    .eq("id", poId);

  await logAudit(
    {
      entityType: "vendor_purchase_order",
      entityId: poId,
      actorId: user.id,
      action: "email_sent",
      metadata: { to_email: vendor.email, resend_id: resendId },
    },
    supabase,
  );

  revalidatePath(`/purchase-orders/${poId}`);
  return {
    success: resend
      ? `Purchase order emailed to ${vendor.email}.`
      : `Email logged (no RESEND_API_KEY set). Would send to ${vendor.email}.`,
  };
}
