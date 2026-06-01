import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeAlerts, ALERT_META } from "@/lib/alerts";
import { getResend, getFromEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";

/**
 * Scheduled by Vercel Cron (see vercel.json). Evaluates alert conditions and
 * optionally emails a digest to admins. Protected by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const alerts = await computeAlerts(supabase);

  if (alerts.length > 0) {
    const resend = getResend();
    if (resend) {
      const { data: admins } = await supabase
        .from("users")
        .select("email")
        .eq("role", "admin")
        .eq("is_active", true);

      const recipients = (admins ?? []).map((a) => a.email).filter(Boolean);
      if (recipients.length > 0) {
        const rows = alerts
          .map(
            (a) =>
              `<li><strong>${ALERT_META[a.type].label}:</strong> ${a.message} (${a.vendorName})</li>`,
          )
          .join("");
        await resend.emails.send({
          from: getFromEmail(),
          to: recipients,
          subject: `Dropship alerts: ${alerts.length} item${alerts.length === 1 ? "" : "s"} need attention`,
          html: `<h2>Dropship Manager alerts</h2><ul>${rows}</ul>`,
        });
      }
    }
  }

  return NextResponse.json({
    evaluated_at: new Date().toISOString(),
    alert_count: alerts.length,
    alerts,
  });
}
