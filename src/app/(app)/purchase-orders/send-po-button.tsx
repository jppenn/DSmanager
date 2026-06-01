"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendPoToVendor } from "./email-actions";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function SendPoButton({ poId, alreadySent }: { poId: string; alreadySent: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; success?: string }>({});

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={alreadySent ? "outline" : "default"}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await sendPoToVendor(poId);
            setResult(r);
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <Mail className="size-4" />}
        {alreadySent ? "Resend to vendor" : "Send to vendor"}
      </Button>
      {result.success && (
        <p className="flex items-center gap-1.5 text-xs text-green-700">
          <CheckCircle2 className="size-3.5" /> {result.success}
        </p>
      )}
      {result.error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5" /> {result.error}
        </p>
      )}
    </div>
  );
}
