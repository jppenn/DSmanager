"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Customer } from "@/lib/types/database";
import type { FormState } from "./actions";
import { AlertCircle } from "lucide-react";

export function CustomerForm({
  customer,
  action,
}: {
  customer?: Customer;
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, {});
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {state.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Customer details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer name" htmlFor="name" required>
            <Input id="name" name="name" defaultValue={customer?.name ?? ""} required />
            {e.name && <p className="text-xs text-destructive">{e.name}</p>}
          </Field>
          <Field label="Contact name" htmlFor="contact_name">
            <Input id="contact_name" name="contact_name" defaultValue={customer?.contact_name ?? ""} />
          </Field>
          <Field label="Contact email" htmlFor="contact_email">
            <Input id="contact_email" name="contact_email" type="email" defaultValue={customer?.contact_email ?? ""} />
          </Field>
          <Field label="Contact phone" htmlFor="contact_phone">
            <Input id="contact_phone" name="contact_phone" defaultValue={customer?.contact_phone ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default ship-to address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Address line 1" htmlFor="ship_to_line1" className="sm:col-span-2">
            <Input id="ship_to_line1" name="ship_to_line1" defaultValue={customer?.ship_to_line1 ?? ""} />
          </Field>
          <Field label="Address line 2" htmlFor="ship_to_line2" className="sm:col-span-2">
            <Input id="ship_to_line2" name="ship_to_line2" defaultValue={customer?.ship_to_line2 ?? ""} />
          </Field>
          <Field label="City" htmlFor="ship_to_city">
            <Input id="ship_to_city" name="ship_to_city" defaultValue={customer?.ship_to_city ?? ""} />
          </Field>
          <Field label="State / Region" htmlFor="ship_to_state">
            <Input id="ship_to_state" name="ship_to_state" defaultValue={customer?.ship_to_state ?? ""} />
          </Field>
          <Field label="Postal code" htmlFor="ship_to_postal_code">
            <Input id="ship_to_postal_code" name="ship_to_postal_code" defaultValue={customer?.ship_to_postal_code ?? ""} />
          </Field>
          <Field label="Country" htmlFor="ship_to_country">
            <Input id="ship_to_country" name="ship_to_country" defaultValue={customer?.ship_to_country ?? "US"} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" name="notes" defaultValue={customer?.notes ?? ""} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={customer ? customer.is_active : true}
              className="size-4 rounded border-input"
            />
            Active customer
          </label>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <SubmitButton>{customer ? "Save changes" : "Create customer"}</SubmitButton>
        <Link
          href={customer ? `/customers/${customer.id}` : "/customers"}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
