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
import type { Product, Vendor } from "@/lib/types/database";
import type { FormState } from "./actions";
import { AlertCircle } from "lucide-react";

export function ProductForm({
  product,
  vendors,
  action,
}: {
  product?: Product;
  vendors: Pick<Vendor, "id" | "name">[];
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
          <CardTitle>Identification</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Our part number" htmlFor="internal_part_number">
            <Input
              id="internal_part_number"
              name="internal_part_number"
              defaultValue={product?.internal_part_number ?? ""}
            />
            {e.internal_part_number && (
              <p className="text-xs text-destructive">{e.internal_part_number}</p>
            )}
          </Field>
          <Field label="SKU" htmlFor="sku">
            <Input id="sku" name="sku" defaultValue={product?.sku ?? ""} />
          </Field>
          <Field label="Description" htmlFor="description" className="sm:col-span-2">
            <Input
              id="description"
              name="description"
              defaultValue={product?.description ?? ""}
            />
          </Field>
          <Field label="Unit of measure" htmlFor="uom">
            <Input id="uom" name="uom" placeholder="ea, box, case..." defaultValue={product?.uom ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor &amp; pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Preferred vendor" htmlFor="vendor_id">
            <Select id="vendor_id" name="vendor_id" defaultValue={product?.vendor_id ?? ""}>
              <option value="">None</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Vendor part number" htmlFor="vendor_part_number">
            <Input
              id="vendor_part_number"
              name="vendor_part_number"
              defaultValue={product?.vendor_part_number ?? ""}
            />
          </Field>
          <Field label="Our cost" htmlFor="unit_cost" hint="What we pay the vendor.">
            <Input
              id="unit_cost"
              name="unit_cost"
              type="number"
              min={0}
              step="0.01"
              defaultValue={product?.unit_cost ?? ""}
            />
          </Field>
          <Field label="Customer price" htmlFor="sell_price" hint="Default sell price.">
            <Input
              id="sell_price"
              name="sell_price"
              type="number"
              min={0}
              step="0.01"
              defaultValue={product?.sell_price ?? ""}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" name="notes" defaultValue={product?.notes ?? ""} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={product ? product.is_active : true}
              className="size-4 rounded border-input"
            />
            Active product
          </label>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <SubmitButton>{product ? "Save changes" : "Create product"}</SubmitButton>
        <Link
          href={product ? `/products/${product.id}` : "/products"}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
