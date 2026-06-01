import { LoginForm } from "./login-form";
import { Package } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary to-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Package className="size-6" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Dropship Manager
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage orders and vendor fulfillment.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
