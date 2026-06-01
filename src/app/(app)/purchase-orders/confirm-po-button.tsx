"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { confirmPo } from "./actions";
import { CheckCircle2, Loader2 } from "lucide-react";

export function ConfirmPoButton({ poId }: { poId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="default"
      disabled={pending}
      onClick={() => startTransition(async () => void (await confirmPo(poId)))}
    >
      {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="size-4" />}
      Mark confirmed
    </Button>
  );
}
