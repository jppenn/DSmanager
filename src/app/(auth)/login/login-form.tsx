"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  sendMagicLink,
  signInWithPassword,
  type AuthState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/submit-button";
import { CheckCircle2, AlertCircle } from "lucide-react";

type Tab = "internal" | "vendor";

export function LoginForm() {
  const [tab, setTab] = useState<Tab>("internal");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
        <button
          type="button"
          onClick={() => setTab("internal")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "internal"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Staff
        </button>
        <button
          type="button"
          onClick={() => setTab("vendor")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "vendor"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Vendor
        </button>
      </div>

      {tab === "internal" ? <MagicLinkForm /> : <PasswordForm />}
    </div>
  );
}

function Alert({ state }: { state: AuthState }) {
  if (state.error) {
    return (
      <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <span>{state.error}</span>
      </div>
    );
  }
  if (state.success && state.success !== "ok") {
    return (
      <div className="flex items-start gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        <span>{state.success}</span>
      </div>
    );
  }
  return null;
}

function MagicLinkForm() {
  const [state, action] = useActionState(sendMagicLink, {});
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Staff sign in with a one-time link sent to your work email.
      </p>
      <Field label="Work email" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          required
        />
      </Field>
      <Alert state={state} />
      <SubmitButton className="w-full" pendingText="Sending link...">
        Send magic link
      </SubmitButton>
    </form>
  );
}

function PasswordForm() {
  const router = useRouter();
  const [state, action] = useActionState(
    async (prev: AuthState, fd: FormData) => {
      const result = await signInWithPassword(prev, fd);
      if (result.success === "ok") router.replace("/portal");
      return result;
    },
    {},
  );
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Vendor partners sign in with their account credentials.
      </p>
      <Field label="Email" htmlFor="vendor-email" required>
        <Input
          id="vendor-email"
          name="email"
          type="email"
          placeholder="you@vendor.com"
          autoComplete="email"
          required
        />
      </Field>
      <Field label="Password" htmlFor="vendor-password" required>
        <Input
          id="vendor-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <Alert state={state} />
      <SubmitButton className="w-full" pendingText="Signing in...">
        Sign in
      </SubmitButton>
    </form>
  );
}
