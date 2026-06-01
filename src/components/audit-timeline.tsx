import type { AuditEvent } from "@/lib/types/database";
import { formatDateTime } from "@/lib/utils";
import {
  CheckCircle2,
  FileText,
  Mail,
  Pencil,
  PlusCircle,
  Truck,
  RefreshCw,
  StickyNote,
  XCircle,
} from "lucide-react";

const ACTION_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  order_created: { label: "Order created", icon: PlusCircle },
  order_updated: { label: "Order updated", icon: Pencil },
  po_created: { label: "Purchase order created", icon: PlusCircle },
  po_updated: { label: "Purchase order updated", icon: Pencil },
  status_changed: { label: "Status changed", icon: RefreshCw },
  email_sent: { label: "Email sent to vendor", icon: Mail },
  vendor_confirmed: { label: "Vendor confirmed", icon: CheckCircle2 },
  tracking_updated: { label: "Tracking updated", icon: Truck },
  shipment_updated: { label: "Shipment updated", icon: Truck },
  note_added: { label: "Note added", icon: StickyNote },
  cancelled: { label: "Cancelled", icon: XCircle },
};

function describe(event: AuditEvent): string {
  const meta = ACTION_META[event.action];
  const base = meta?.label ?? event.action.replace(/_/g, " ");
  const m = event.metadata ?? {};
  if (event.action === "status_changed" && m.from && m.to) {
    return `Status changed from ${String(m.from)} to ${String(m.to)}`;
  }
  if (event.action === "email_sent" && m.to_email) {
    return `Email sent to ${String(m.to_email)}`;
  }
  return base;
}

export function AuditTimeline({
  events,
  actorNames,
}: {
  events: AuditEvent[];
  actorNames: Record<string, string>;
}) {
  if (events.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">No activity yet.</p>
    );
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => {
        const meta = ACTION_META[event.action];
        const Icon = meta?.icon ?? FileText;
        const actor = event.actor_id
          ? (actorNames[event.actor_id] ?? "Unknown user")
          : "System";
        return (
          <li key={event.id} className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium">{describe(event)}</p>
              <p className="text-xs text-muted-foreground">
                {actor} &middot; {formatDateTime(event.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
