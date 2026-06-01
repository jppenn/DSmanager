"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/submit-button";
import { inviteUser, type ActionState } from "./actions";
import type { Vendor } from "@/lib/types/database";

export function InviteForm({
  vendors,
}: {
  vendors: Pick<Vendor, "id" | "name">[];
}) {
  const [state, action] = useActionState<ActionState, FormData>(inviteUser, {});

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Email" htmlFor="invite_email" required>
        <Input id="invite_email" name="email" type="email" required />
      </Field>
      <Field label="Full name" htmlFor="invite_name">
        <Input id="invite_name" name="full_name" />
      </Field>
      <Field label="Role" htmlFor="invite_role">
        <Select id="invite_role" name="role" defaultValue="order_manager">
          <option value="admin">Admin</option>
          <option value="order_manager">Order Manager</option>
          <option value="vendor">Vendor</option>
        </Select>
      </Field>
      <Field label="Vendor (if vendor role)" htmlFor="invite_vendor">
        <Select id="invite_vendor" name="vendor_id" defaultValue="">
          <option value="">None</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
        <SubmitButton>Send invitation</SubmitButton>
        {state.success && (
          <span className="text-sm text-green-700">{state.success}</span>
        )}
        {state.error && (
          <span className="text-sm text-destructive">{state.error}</span>
        )}
      </div>
    </form>
  );
}
