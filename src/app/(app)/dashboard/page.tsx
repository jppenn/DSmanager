import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computeAlerts, ALERT_META, type AlertSeverity } from "@/lib/alerts";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuditTimeline } from "@/components/audit-timeline";
import {
  Clock,
  PackageCheck,
  AlertTriangle,
  CalendarX,
  TriangleAlert,
} from "lucide-react";

const severityColor: Record<AlertSeverity, "red" | "amber" | "gray"> = {
  high: "red",
  medium: "amber",
  low: "gray",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: pos }, alerts, recentEvents] = await Promise.all([
    supabase
      .from("vendor_purchase_orders")
      .select("id, status, confirmed_at"),
    computeAlerts(supabase),
    loadRecentActivity(),
  ]);

  const list = pos ?? [];
  const awaiting = list.filter(
    (p) => p.status === "sent" && !p.confirmed_at,
  ).length;
  const partiallyShipped = list.filter(
    (p) => p.status === "partially_shipped",
  ).length;
  const late = alerts.filter((a) => a.type === "ship_date_passed").length;
  const needAttention = alerts.filter((a) => a.severity !== "low").length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of dropship orders and items needing attention."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Awaiting confirmation"
          value={awaiting}
          icon={Clock}
          accent="blue"
          href="/purchase-orders?status=sent"
        />
        <StatCard
          label="Partially shipped"
          value={partiallyShipped}
          icon={PackageCheck}
          accent="purple"
          href="/purchase-orders?status=partially_shipped"
        />
        <StatCard
          label="Late orders"
          value={late}
          icon={CalendarX}
          accent="red"
        />
        <StatCard
          label="Need attention"
          value={needAttention}
          icon={AlertTriangle}
          accent="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TriangleAlert className="size-4 text-amber-600" />
              Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                All clear. No alerts right now.
              </p>
            ) : (
              alerts.slice(0, 12).map((a, i) => (
                <Link
                  key={`${a.poId}-${a.type}-${i}`}
                  href={`/purchase-orders/${a.poId}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm transition-colors hover:bg-secondary/40"
                >
                  <div className="flex items-center gap-3">
                    <Badge color={severityColor[a.severity]}>
                      {ALERT_META[a.type].label}
                    </Badge>
                    <span>{a.message}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {a.vendorName}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent vendor activity</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditTimeline
              events={recentEvents.events}
              actorNames={recentEvents.actorNames}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

async function loadRecentActivity() {
  const supabase = await createClient();
  const [{ data: events }, { data: users }] = await Promise.all([
    supabase
      .from("audit_events")
      .select("*")
      .eq("entity_type", "vendor_purchase_order")
      .in("action", [
        "vendor_confirmed",
        "tracking_updated",
        "status_changed",
        "email_sent",
        "po_created",
      ])
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("users").select("id, full_name, email"),
  ]);

  const actorNames: Record<string, string> = {};
  for (const u of users ?? []) actorNames[u.id] = u.full_name ?? u.email;

  return { events: events ?? [], actorNames };
}
