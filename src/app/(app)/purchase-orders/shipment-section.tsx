"use client";

import { useActionState, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { DeliveryStatusBadge } from "@/components/ui/status-badge";
import {
  saveShipment,
  uploadPod,
  getPodSignedUrl,
  type FormState,
} from "./shipment-actions";
import { CARRIERS, DELIVERY_STATUSES, DELIVERY_STATUS_META } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Shipment } from "@/lib/types/database";
import { Plus, Paperclip, FileDown, X } from "lucide-react";

export function ShipmentSection({
  poId,
  shipments,
  canEdit,
}: {
  poId: string;
  shipments: Shipment[];
  canEdit: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {shipments.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">
          No shipments recorded yet.
        </p>
      )}

      <div className="space-y-3">
        {shipments.map((s) =>
          editingId === s.id ? (
            <ShipmentForm
              key={s.id}
              poId={poId}
              shipment={s}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <ShipmentCard
              key={s.id}
              poId={poId}
              shipment={s}
              canEdit={canEdit}
              onEdit={() => setEditingId(s.id)}
            />
          ),
        )}
      </div>

      {canEdit &&
        (adding ? (
          <ShipmentForm poId={poId} onDone={() => setAdding(false)} />
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" /> Add shipment
          </Button>
        ))}
    </div>
  );
}

function ShipmentCard({
  poId,
  shipment,
  canEdit,
  onEdit,
}: {
  poId: string;
  shipment: Shipment;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function viewPod() {
    if (!shipment.pod_file_path) return;
    startTransition(async () => {
      const { url } = await getPodSignedUrl(shipment.pod_file_path!);
      if (url) window.open(url, "_blank");
    });
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <DeliveryStatusBadge status={shipment.delivery_status} />
            <span className="font-medium">{shipment.carrier ?? "Carrier TBD"}</span>
          </div>
          <div className="text-muted-foreground">
            Tracking: {shipment.tracking_number ?? "-"}
          </div>
          <div className="text-muted-foreground">
            Shipped: {formatDate(shipment.actual_ship_date)} &middot; Est. delivery:{" "}
            {formatDate(shipment.est_delivery_date)}
          </div>
          {shipment.notes && (
            <div className="text-muted-foreground">{shipment.notes}</div>
          )}
        </div>
        {canEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {shipment.pod_file_path ? (
          <Button variant="outline" size="sm" disabled={pending} onClick={viewPod}>
            <FileDown className="size-4" /> View proof of delivery
          </Button>
        ) : (
          canEdit && <PodUpload poId={poId} shipmentId={shipment.id} />
        )}
      </div>
    </div>
  );
}

function PodUpload({ poId, shipmentId }: { poId: string; shipmentId: string }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string>("");

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          const r = await uploadPod(poId, shipmentId, fd);
          setMsg(r.error ?? r.success ?? "");
        })
      }
      className="flex items-center gap-2"
    >
      <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
        <Paperclip className="size-4" />
        <input type="file" name="file" className="max-w-[180px] text-xs" />
      </label>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        Upload POD
      </Button>
      {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
    </form>
  );
}

function ShipmentForm({
  poId,
  shipment,
  onDone,
}: {
  poId: string;
  shipment?: Shipment;
  onDone: () => void;
}) {
  const action = saveShipment.bind(null, poId, shipment?.id ?? null);
  const [state, formAction] = useActionState<FormState, FormData>(
    async (prev, fd) => {
      const r = await action(prev, fd);
      if (!r.error && !r.fieldErrors) onDone();
      return r;
    },
    {},
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-border bg-secondary/20 p-4"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          {shipment ? "Edit shipment" : "New shipment"}
        </h4>
        <Button type="button" variant="ghost" size="icon" onClick={onDone}>
          <X className="size-4" />
        </Button>
      </div>

      {state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Carrier" htmlFor="carrier">
          <Select id="carrier" name="carrier" defaultValue={shipment?.carrier ?? ""}>
            <option value="">Select...</option>
            {CARRIERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tracking number" htmlFor="tracking_number">
          <Input
            id="tracking_number"
            name="tracking_number"
            defaultValue={shipment?.tracking_number ?? ""}
          />
        </Field>
        <Field label="Estimated ship date" htmlFor="est_ship_date">
          <Input
            id="est_ship_date"
            name="est_ship_date"
            type="date"
            defaultValue={shipment?.est_ship_date ?? ""}
          />
        </Field>
        <Field label="Actual ship date" htmlFor="actual_ship_date">
          <Input
            id="actual_ship_date"
            name="actual_ship_date"
            type="date"
            defaultValue={shipment?.actual_ship_date ?? ""}
          />
        </Field>
        <Field label="Estimated delivery" htmlFor="est_delivery_date">
          <Input
            id="est_delivery_date"
            name="est_delivery_date"
            type="date"
            defaultValue={shipment?.est_delivery_date ?? ""}
          />
        </Field>
        <Field label="Delivery status" htmlFor="delivery_status">
          <Select
            id="delivery_status"
            name="delivery_status"
            defaultValue={shipment?.delivery_status ?? "pending"}
          >
            {DELIVERY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {DELIVERY_STATUS_META[s].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={shipment?.notes ?? ""} />
      </Field>
      <div className="flex gap-2">
        <SubmitButton size="sm">Save shipment</SubmitButton>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
