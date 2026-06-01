"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VENDOR_PO_STATUSES, VENDOR_PO_STATUS_META } from "@/lib/constants";
import type { Vendor, VendorPurchaseOrder } from "@/lib/types/database";
import type { FormState } from "./actions";
import { AlertCircle } from "lucide-react";

export function PoEditForm({
  po,
  vendors,
  action,
}: {
  po: VendorPurchaseOrder;
  vendors: Pick<Vendor, "id" | "name">[];
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, {});
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="customer_order_id" value={po.customer_order_id} />

      {state.error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {state.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Purchase order</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Vendor" htmlFor="vendor_id" required>
            <Select id="vendor_id" name="vendor_id" defaultValue={po.vendor_id} required>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
            {e.vendor_id && <p className="text-xs text-destructive">{e.vendor_id}</p>}
          </Field>
          <Field label="Status" htmlFor="status">
            <Select id="status" name="status" defaultValue={po.status}>
              {VENDOR_PO_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {VENDOR_PO_STATUS_META[s].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Requested ship date" htmlFor="requested_ship_date">
            <Input
              id="requested_ship_date"
              name="requested_ship_date"
              type="date"
              defaultValue={po.requested_ship_date ?? ""}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ship-to address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Address line 1" htmlFor="ship_to_line1" className="sm:col-span-2">
            <Input id="ship_to_line1" name="ship_to_line1" defaultValue={po.ship_to_line1 ?? ""} />
          </Field>
          <Field label="Address line 2" htmlFor="ship_to_line2" className="sm:col-span-2">
            <Input id="ship_to_line2" name="ship_to_line2" defaultValue={po.ship_to_line2 ?? ""} />
          </Field>
          <Field label="City" htmlFor="ship_to_city">
            <Input id="ship_to_city" name="ship_to_city" defaultValue={po.ship_to_city ?? ""} />
          </Field>
          <Field label="State / Region" htmlFor="ship_to_state">
            <Input id="ship_to_state" name="ship_to_state" defaultValue={po.ship_to_state ?? ""} />
          </Field>
          <Field label="Postal code" htmlFor="ship_to_postal_code">
            <Input id="ship_to_postal_code" name="ship_to_postal_code" defaultValue={po.ship_to_postal_code ?? ""} />
          </Field>
          <Field label="Country" htmlFor="ship_to_country">
            <Input id="ship_to_country" name="ship_to_country" defaultValue={po.ship_to_country ?? "US"} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          <Field label="Special instructions" htmlFor="special_instructions">
            <Textarea id="special_instructions" name="special_instructions" defaultValue={po.special_instructions ?? ""} />
          </Field>
          <Field label="Internal notes" htmlFor="internal_notes">
            <Textarea id="internal_notes" name="internal_notes" defaultValue={po.internal_notes ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <SubmitButton>Save changes</SubmitButton>
        <Link href={`/purchase-orders/${po.id}`} className={buttonVariants({ variant: "outline" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
