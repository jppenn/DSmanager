import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/lib/types/database";

/**
 * Returns the current authenticated user's profile (or null).
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile ?? null;
}

/**
 * Requires any authenticated, active user. Redirects to /login otherwise.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.is_active) redirect("/login?error=inactive");
  return user;
}

/**
 * Requires an internal user (admin or order_manager).
 * Vendor users are routed to their portal.
 */
export async function requireInternal(): Promise<User> {
  const user = await requireUser();
  if (user.role === "vendor") redirect("/portal");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireInternal();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

/**
 * Requires a vendor user with an attached vendor_id.
 */
export async function requireVendor(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "vendor" || !user.vendor_id) redirect("/dashboard");
  return user;
}
