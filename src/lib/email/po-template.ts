import { formatDate } from "@/lib/utils";
import type {
  VendorPurchaseOrder,
  VendorPurchaseOrderItem,
  Vendor,
} from "@/lib/types/database";

export interface PoEmailData {
  po: VendorPurchaseOrder;
  vendor: Pick<Vendor, "name" | "contact_person">;
  items: VendorPurchaseOrderItem[];
  confirmUrl: string;
  fromCompany?: string;
}

function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shipTo(po: VendorPurchaseOrder): string {
  return [
    po.ship_to_line1,
    po.ship_to_line2,
    [po.ship_to_city, po.ship_to_state].filter(Boolean).join(", "),
    po.ship_to_postal_code,
    po.ship_to_country,
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join("<br/>");
}

export function buildPoEmailSubject(po: VendorPurchaseOrder): string {
  return `Purchase Order ${po.po_number} - action requested`;
}

/**
 * Returns an HTML email body for a vendor purchase order. Kept as plain HTML
 * so it renders reliably across email clients without a client-side runtime.
 */
export function buildPoEmailHtml(data: PoEmailData): string {
  const { po, vendor, items, confirmUrl, fromCompany = "Dropship Manager" } = data;

  const rows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(it.sku) || "-"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(it.description) || "-"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${it.quantity}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
    <div style="max-width:640px;margin:0 auto;padding:24px;">
      <div style="background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e5e9f0;">
        <h1 style="margin:0 0 4px;font-size:20px;">Purchase Order ${escapeHtml(po.po_number)}</h1>
        <p style="margin:0 0 20px;color:#647184;font-size:14px;">From ${escapeHtml(fromCompany)}</p>

        <p style="font-size:14px;">Hello ${escapeHtml(vendor.contact_person) || escapeHtml(vendor.name)},</p>
        <p style="font-size:14px;">Please review and confirm the following dropship purchase order.</p>

        <h3 style="font-size:14px;margin:20px 0 6px;">Ship-to address</h3>
        <p style="font-size:14px;margin:0;color:#3e4c59;">${shipTo(po)}</p>

        <h3 style="font-size:14px;margin:20px 0 6px;">Requested ship date</h3>
        <p style="font-size:14px;margin:0;color:#3e4c59;">${escapeHtml(formatDate(po.requested_ship_date))}</p>

        <h3 style="font-size:14px;margin:20px 0 6px;">Line items</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="text-align:left;color:#647184;">
              <th style="padding:8px;border-bottom:2px solid #e5e9f0;">SKU</th>
              <th style="padding:8px;border-bottom:2px solid #e5e9f0;">Description</th>
              <th style="padding:8px;border-bottom:2px solid #e5e9f0;text-align:right;">Qty</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        ${
          po.special_instructions
            ? `<h3 style="font-size:14px;margin:20px 0 6px;">Special instructions</h3>
        <p style="font-size:14px;margin:0;color:#3e4c59;">${escapeHtml(po.special_instructions)}</p>`
            : ""
        }

        <div style="margin:28px 0;">
          <a href="${escapeHtml(confirmUrl)}"
             style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:bold;">
            Confirm this purchase order
          </a>
        </div>
        <p style="font-size:12px;color:#647184;">
          If the button does not work, copy and paste this link into your browser:<br/>
          <a href="${escapeHtml(confirmUrl)}" style="color:#2563eb;">${escapeHtml(confirmUrl)}</a>
        </p>
        <p style="font-size:12px;color:#647184;">Or simply reply to this email to confirm.</p>
      </div>
      <p style="text-align:center;color:#9aa5b1;font-size:11px;margin-top:16px;">
        Sent via ${escapeHtml(fromCompany)} - PO total value not included for confidentiality.
      </p>
    </div>
  </body>
</html>`;
}

export function buildPoEmailText(data: PoEmailData): string {
  const { po, items, confirmUrl } = data;
  const lines = items
    .map((it) => `- ${it.sku ?? ""} ${it.description ?? ""} x ${it.quantity}`)
    .join("\n");
  return [
    `Purchase Order ${po.po_number}`,
    "",
    `Requested ship date: ${formatDate(po.requested_ship_date)}`,
    "",
    "Line items:",
    lines,
    "",
    po.special_instructions ? `Special instructions: ${po.special_instructions}` : "",
    "",
    `Confirm this purchase order: ${confirmUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
}
