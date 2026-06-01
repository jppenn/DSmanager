"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import type { UserRole } from "@/lib/types/database";

export interface ActionState {
  error?: string;
  success?: string;
}

export async function updateUser(
  userId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const role = String(formData.get("role")) as UserRole;
  const vendorIdRaw = String(formData.get("vendor_id") ?? "");
  const isActive = formData.get("is_active") === "on";

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({
      role,
      vendor_id: role === "vendor" && vendorIdRaw ? vendorIdRaw : null,
      is_active: isActive,
    })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/settings/users");
  return { success: "User updated." };
}

export async function inviteUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "order_manager") as UserRole;
  const vendorId = String(formData.get("vendor_id") ?? "");

  if (!email) return { error: "Email is required." };

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/auth/callback`,
    data: { full_name: fullName, role },
  });

  if (error) return { error: error.message };

  // Ensure the profile reflects the chosen role / vendor (trigger may default).
  if (data.user) {
    await admin
      .from("users")
      .update({
        full_name: fullName || email,
        role,
        vendor_id: role === "vendor" && vendorId ? vendorId : null,
      })
      .eq("id", data.user.id);
  }

  revalidatePath("/settings/users");
  return { success: `Invitation sent to ${email}.` };
}
