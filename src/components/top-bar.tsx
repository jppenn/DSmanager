import { LogOut } from "lucide-react";
import type { User } from "@/lib/types/database";

export function TopBar({ user }: { user: User }) {
  const initials = (user.full_name ?? user.email)
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-5">
      <div className="text-sm font-medium text-muted-foreground capitalize">
        {user.role.replace("_", " ")}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </div>
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium leading-tight">
              {user.full_name ?? user.email}
            </div>
            <div className="text-xs text-muted-foreground leading-tight">
              {user.email}
            </div>
          </div>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            title="Sign out"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
