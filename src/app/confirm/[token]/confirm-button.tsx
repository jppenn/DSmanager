"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { confirmPoByToken } from "./actions";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export function ConfirmButton({
  token,
  alreadyConfirmed,
}: {
  token: string;
  alreadyConfirmed: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(alreadyConfirmed);
  const [error, setError] = useState<string>("");

  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
        <CheckCircle2 className="size-5" />
        This purchase order has been confirmed. Thank you!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await confirmPoByToken(token);
            if (r.success) setDone(true);
            else setError(r.error ?? "Something went wrong.");
          })
        }
      >
        {pending && <Loader2 className="animate-spin" />}
        Confirm this purchase order
      </Button>
      {error && (
        <p className="flex items-center justify-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="size-4" /> {error}
        </p>
      )}
    </div>
  );
}
