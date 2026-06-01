"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type {
  Vendor,
  CustomerOrder,
  CustomerOrderItem,
} from "@/lib/types/database";
import type { FormState } from "./actions";
import { AlertCircle } from "lucide-react";

export function PoForm({
  order,
  vendors,
  availableItems,
  action,
}: {
  order: CustomerOrder;
  vendors: Pick<Vendor, "id" | "name">[];
  availableItems: CustomerOrderItem[];
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, {});
  const e = state.fieldErrors ?? {};
  const [selected, setSelected] = useState<Set<string>>(
    new Set(availableItems.map((i) => i.id)),
  );

  function toggle(itemId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="customer_order_id" value={order.id} />

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
            <Select id="vendor_id" name="vendor_id" defaultValue="" required>
              <option value="" disabled>
                Select a vendor...
              </option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
            {e.vendor_id && (
              <p className="text-xs text-destructive">{e.vendor_id}</p>
            )}
          </Field>
          <Field label="Requested ship date" htmlFor="requested_ship_date">
            <Input
              id="requested_ship_date"
              name="requested_ship_date"
              type="date"
              defaultValue={order.requested_ship_date ?? ""}
            />
          </Field>
          <input type="hidden" name="status" value="draft" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line items to dropship</CardTitle>
        </CardHeader>
        <CardContent>
          {availableItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All line items on this order are already assigned to a vendor PO.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-10 p-2" />
                    <th className="p-2">SKU</th>
                    <th className="p-2">Description</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Unit cost</th>
                  </tr>
                </thead>
                <tbody>
                  {availableItems.map((it) => (
                    <tr key={it.id} className="border-t border-border">
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          name="item_ids"
                          value={it.id}
                          checked={selected.has(it.id)}
                          onChange={() => toggle(it.id)}
                          className="size-4 rounded border-input"
                        />
                      </td>
                      <td className="p-2 font-medium">{it.sku ?? "-"}</td>
                      <td className="p-2">{it.description ?? "-"}</td>
                      <td className="p-2 text-right tabular-nums">{it.quantity}</td>
                      <td className="p-2 text-right tabular-nums">
                        {formatCurrency(it.unit_cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ship-to address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Address line 1" htmlFor="ship_to_line1" className="sm:col-span-2">
            <Input id="ship_to_line1" name="ship_to_line1" defaultValue={order.ship_to_line1 ?? ""} />
          </Field>
          <Field label="Address line 2" htmlFor="ship_to_line2" className="sm:col-span-2">
            <Input id="ship_to_line2" name="ship_to_line2" defaultValue={order.ship_to_line2 ?? ""} />
          </Field>
          <Field label="City" htmlFor="ship_to_city">
            <Input id="ship_to_city" name="ship_to_city" defaultValue={order.ship_to_city ?? ""} />
          </Field>
          <Field label="State / Region" htmlFor="ship_to_state">
            <Input id="ship_to_state" name="ship_to_state" defaultValue={order.ship_to_state ?? ""} />
          </Field>
          <Field label="Postal code" htmlFor="ship_to_postal_code">
            <Input id="ship_to_postal_code" name="ship_to_postal_code" defaultValue={order.ship_to_postal_code ?? ""} />
          </Field>
          <Field label="Country" htmlFor="ship_to_country">
            <Input id="ship_to_country" name="ship_to_country" defaultValue={order.ship_to_country ?? "US"} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          <Field label="Special instructions" htmlFor="special_instructions">
            <Textarea id="special_instructions" name="special_instructions" />
          </Field>
          <Field label="Internal notes" htmlFor="internal_notes">
            <Textarea id="internal_notes" name="internal_notes" />
          </Field>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <SubmitButton>Create purchase order</SubmitButton>
        <Link
          href={`/orders/${order.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
