import { requireVendor } from "@/lib/auth";
import { TopBar } from "@/components/top-bar";
import { Package } from "lucide-react";
import Link from "next/link";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireVendor();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex h-14 items-center border-b border-border bg-card px-5">
        <Link href="/portal" className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="size-4" />
          </div>
          <span className="text-sm font-semibold">Vendor Portal</span>
        </Link>
      </div>
      <TopBar user={user} />
      <main className="flex-1 px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">{children}</div>
      </main>
    </div>
  );
}
