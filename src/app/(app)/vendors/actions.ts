"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/auth";
import { vendorSchema } from "@/lib/validation";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return vendorSchema.safeParse({
    ...raw,
    is_active: formData.get("is_active") === "on" || raw.is_active === "true",
  });
}

export async function createVendor(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireInternal();
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .insert({ ...parsed.data, created_by: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/vendors");
  redirect(`/vendors/${data.id}`);
}

export async function updateVendor(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireInternal();
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("vendors").update(parsed.data).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/vendors");
  revalidatePath(`/vendors/${id}`);
  redirect(`/vendors/${id}`);
}

function flatten(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
