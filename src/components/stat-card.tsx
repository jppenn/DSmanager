import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  href,
  icon: Icon,
  accent = "blue",
}: {
  label: string;
  value: number | string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "blue" | "amber" | "red" | "green" | "purple";
}) {
  const accentClass = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  }[accent];

  const content = (
    <Card className="flex items-center gap-4 p-5 transition-shadow hover:shadow-md">
      <div className={cn("flex size-11 items-center justify-center rounded-lg", accentClass)}>
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
