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
import {
  LineItemsEditor,
  type EditableItem,
  type ProductOption,
} from "./line-items-editor";
import { CUSTOMER_ORDER_STATUSES, CUSTOMER_ORDER_STATUS_META } from "@/lib/constants";
import type { Customer, CustomerOrder } from "@/lib/types/database";
import type { FormState } from "./actions";
import { AlertCircle } from "lucide-react";

export function OrderForm({
  customers,
  order,
  items,
  products,
  action,
}: {
  customers: Pick<Customer, "id" | "name">[];
  order?: CustomerOrder;
  items?: EditableItem[];
  products?: ProductOption[];
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
          <CardTitle>Order details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer" htmlFor="customer_id" required>
            <Select
              id="customer_id"
              name="customer_id"
              defaultValue={order?.customer_id ?? ""}
              required
            >
              <option value="" disabled>
                Select a customer...
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {e.customer_id && (
              <p className="text-xs text-destructive">{e.customer_id}</p>
            )}
          </Field>
          <Field label="Status" htmlFor="status">
            <Select id="status" name="status" defaultValue={order?.status ?? "draft"}>
              {CUSTOMER_ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {CUSTOMER_ORDER_STATUS_META[s].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Customer PO number" htmlFor="customer_po_number">
            <Input
              id="customer_po_number"
              name="customer_po_number"
              defaultValue={order?.customer_po_number ?? ""}
            />
          </Field>
          <Field label="Salesperson" htmlFor="salesperson">
            <Input
              id="salesperson"
              name="salesperson"
              defaultValue={order?.salesperson ?? ""}
            />
          </Field>
          <Field label="Requested ship date" htmlFor="requested_ship_date">
            <Input
              id="requested_ship_date"
              name="requested_ship_date"
              type="date"
              defaultValue={order?.requested_ship_date ?? ""}
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
            <Input id="ship_to_line1" name="ship_to_line1" defaultValue={order?.ship_to_line1 ?? ""} />
          </Field>
          <Field label="Address line 2" htmlFor="ship_to_line2" className="sm:col-span-2">
            <Input id="ship_to_line2" name="ship_to_line2" defaultValue={order?.ship_to_line2 ?? ""} />
          </Field>
          <Field label="City" htmlFor="ship_to_city">
            <Input id="ship_to_city" name="ship_to_city" defaultValue={order?.ship_to_city ?? ""} />
          </Field>
          <Field label="State / Region" htmlFor="ship_to_state">
            <Input id="ship_to_state" name="ship_to_state" defaultValue={order?.ship_to_state ?? ""} />
          </Field>
          <Field label="Postal code" htmlFor="ship_to_postal_code">
            <Input id="ship_to_postal_code" name="ship_to_postal_code" defaultValue={order?.ship_to_postal_code ?? ""} />
          </Field>
          <Field label="Country" htmlFor="ship_to_country">
            <Input id="ship_to_country" name="ship_to_country" defaultValue={order?.ship_to_country ?? "US"} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent>
          <LineItemsEditor initial={items} products={products} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <Field label="Internal notes" htmlFor="internal_notes">
            <Textarea
              id="internal_notes"
              name="internal_notes"
              defaultValue={order?.internal_notes ?? ""}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <SubmitButton>{order ? "Save changes" : "Create order"}</SubmitButton>
        <Link
          href={order ? `/orders/${order.id}` : "/orders"}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
