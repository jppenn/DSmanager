"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import { TableCell, TableRow } from "@/components/ui/table";
import { updateUser, type ActionState } from "./actions";
import type { User, Vendor } from "@/lib/types/database";

export function UserRow({
  user,
  vendors,
}: {
  user: User;
  vendors: Pick<Vendor, "id" | "name">[];
}) {
  const action = updateUser.bind(null, user.id);
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{user.full_name ?? "-"}</div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </TableCell>
      <TableCell colSpan={3}>
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <Select name="role" defaultValue={user.role} className="w-40">
            <option value="admin">Admin</option>
            <option value="order_manager">Order Manager</option>
            <option value="vendor">Vendor</option>
          </Select>
          <Select name="vendor_id" defaultValue={user.vendor_id ?? ""} className="w-44">
            <option value="">No vendor</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={user.is_active}
              className="size-4 rounded border-input"
            />
            Active
          </label>
          <SubmitButton size="sm" variant="outline">
            Save
          </SubmitButton>
          {state.success && (
            <span className="text-xs text-green-700">{state.success}</span>
          )}
          {state.error && (
            <span className="text-xs text-destructive">{state.error}</span>
          )}
        </form>
      </TableCell>
    </TableRow>
  );
}
