"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface EditableItem {
  id?: string;
  sku: string;
  description: string;
  quantity: number;
  unit_cost: string;
  sell_price: string;
  notes: string;
}

export interface ProductOption {
  id: string;
  internal_part_number: string | null;
  sku: string | null;
  description: string | null;
  unit_cost: number | null;
  sell_price: number | null;
}

function rowIsEmpty(it: EditableItem): boolean {
  return (
    !it.id &&
    it.sku === "" &&
    it.description === "" &&
    it.unit_cost === "" &&
    it.sell_price === "" &&
    it.notes === "" &&
    (Number(it.quantity) || 0) <= 1
  );
}

function itemFromProduct(p: ProductOption): EditableItem {
  return {
    sku: p.sku ?? p.internal_part_number ?? "",
    description: p.description ?? "",
    quantity: 1,
    unit_cost: p.unit_cost != null ? String(p.unit_cost) : "",
    sell_price: p.sell_price != null ? String(p.sell_price) : "",
    notes: "",
  };
}

const blank = (): EditableItem => ({
  sku: "",
  description: "",
  quantity: 1,
  unit_cost: "",
  sell_price: "",
  notes: "",
});

export function LineItemsEditor({
  initial,
  products = [],
}: {
  initial?: EditableItem[];
  products?: ProductOption[];
}) {
  const [items, setItems] = useState<EditableItem[]>(
    initial && initial.length > 0 ? initial : [blank()],
  );

  function update(index: number, patch: Partial<EditableItem>) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    );
  }

  function addRow() {
    setItems((prev) => [...prev, blank()]);
  }

  function addFromCatalog(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const row = itemFromProduct(product);
    setItems((prev) => {
      const lastIndex = prev.length - 1;
      if (lastIndex >= 0 && rowIsEmpty(prev[lastIndex])) {
        return prev.map((it, i) => (i === lastIndex ? row : it));
      }
      return [...prev, row];
    });
  }

  function removeRow(index: number) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  const totals = items.reduce(
    (acc, it) => {
      const qty = Number(it.quantity) || 0;
      const cost = Number(it.unit_cost) || 0;
      const sell = Number(it.sell_price) || 0;
      acc.cost += qty * cost;
      acc.revenue += qty * sell;
      return acc;
    },
    { cost: 0, revenue: 0 },
  );
  const margin = totals.revenue - totals.cost;

  const serialized = JSON.stringify(
    items.map((it) => ({
      id: it.id,
      sku: it.sku || null,
      description: it.description || null,
      quantity: Number(it.quantity) || 0,
      unit_cost: it.unit_cost === "" ? null : Number(it.unit_cost),
      sell_price: it.sell_price === "" ? null : Number(it.sell_price),
      notes: it.notes || null,
    })),
  );

  return (
    <div className="space-y-3">
      <input type="hidden" name="items_json" value={serialized} />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="p-2 font-semibold">SKU</th>
              <th className="p-2 font-semibold">Description</th>
              <th className="w-20 p-2 font-semibold">Qty</th>
              <th className="w-28 p-2 font-semibold">Unit cost</th>
              <th className="w-28 p-2 font-semibold">Sell price</th>
              <th className="w-24 p-2 text-right font-semibold">Margin</th>
              <th className="w-10 p-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const qty = Number(it.quantity) || 0;
              const lineMargin =
                (Number(it.sell_price) || 0) * qty -
                (Number(it.unit_cost) || 0) * qty;
              return (
                <tr key={i} className="border-t border-border align-top">
                  <td className="p-2">
                    <Input
                      value={it.sku}
                      onChange={(e) => update(i, { sku: e.target.value })}
                      placeholder="SKU"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={it.description}
                      onChange={(e) => update(i, { description: e.target.value })}
                      placeholder="Product description"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      value={it.quantity}
                      onChange={(e) =>
                        update(i, { quantity: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={it.unit_cost}
                      onChange={(e) => update(i, { unit_cost: e.target.value })}
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={it.sell_price}
                      onChange={(e) => update(i, { sell_price: e.target.value })}
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-2 text-right tabular-nums text-muted-foreground">
                    {formatCurrency(lineMargin)}
                  </td>
                  <td className="p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(i)}
                      title="Remove line"
                    >
                      <Trash2 className="size-4 text-muted-foreground" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-4" /> Add line item
          </Button>
          {products.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) addFromCatalog(e.target.value);
                e.target.value = "";
              }}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Add from catalog...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {[p.internal_part_number ?? p.sku, p.description]
                    .filter(Boolean)
                    .join(" - ")}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex gap-6 text-sm">
          <span className="text-muted-foreground">
            Revenue:{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(totals.revenue)}
            </span>
          </span>
          <span className="text-muted-foreground">
            Cost:{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(totals.cost)}
            </span>
          </span>
          <span className="text-muted-foreground">
            Margin:{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(margin)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
