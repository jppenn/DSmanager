"use client";

import { useTransition } from "react";
import { Select } from "@/components/ui/select";
import { updatePoStatus } from "./actions";
import { VENDOR_PO_STATUSES, VENDOR_PO_STATUS_META } from "@/lib/constants";
import type { VendorPoStatus } from "@/lib/types/database";
import { Loader2 } from "lucide-react";

export function PoStatusControl({
  id,
  status,
}: {
  id: string;
  status: VendorPoStatus;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Select
        value={status}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as VendorPoStatus;
          startTransition(async () => {
            await updatePoStatus(id, next);
          });
        }}
        className="w-48"
      >
        {VENDOR_PO_STATUSES.map((s) => (
          <option key={s} value={s}>
            {VENDOR_PO_STATUS_META[s].label}
          </option>
        ))}
      </Select>
      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
    </div>
  );
}
