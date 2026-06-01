"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Vendor } from "@/lib/types/database";
import type { FormState } from "./actions";
import { AlertCircle } from "lucide-react";

export function VendorForm({
  vendor,
  action,
}: {
  vendor?: Vendor;
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
          <CardTitle>Vendor details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Vendor name" htmlFor="name" required>
            <Input id="name" name="name" defaultValue={vendor?.name ?? ""} required />
            {e.name && <p className="text-xs text-destructive">{e.name}</p>}
          </Field>
          <Field label="Contact person" htmlFor="contact_person">
            <Input id="contact_person" name="contact_person" defaultValue={vendor?.contact_person ?? ""} />
          </Field>
          <Field label="Email" htmlFor="email" hint="Purchase orders are emailed here.">
            <Input id="email" name="email" type="email" defaultValue={vendor?.email ?? ""} />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" defaultValue={vendor?.phone ?? ""} />
          </Field>
          <Field label="Payment terms" htmlFor="payment_terms">
            <Input id="payment_terms" name="payment_terms" placeholder="Net 30" defaultValue={vendor?.payment_terms ?? ""} />
          </Field>
          <Field label="Lead time (days)" htmlFor="lead_time_days">
            <Input id="lead_time_days" name="lead_time_days" type="number" min={0} defaultValue={vendor?.lead_time_days ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" name="notes" defaultValue={vendor?.notes ?? ""} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={vendor ? vendor.is_active : true}
              className="size-4 rounded border-input"
            />
            Active vendor
          </label>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <SubmitButton>{vendor ? "Save changes" : "Create vendor"}</SubmitButton>
        <Link
          href={vendor ? `/vendors/${vendor.id}` : "/vendors"}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
