import { createClient } from "@/lib/supabase/server";
import type { AuditEvent, OrderNote, EntityType } from "@/lib/types/database";

export interface TimelineData {
  events: AuditEvent[];
  notes: OrderNote[];
  actorNames: Record<string, string>;
}

/**
 * Loads the audit events and notes for an entity, plus a map of user ids to
 * display names for rendering "who did what".
 */
export async function getTimeline(
  entityType: EntityType,
  entityId: string,
): Promise<TimelineData> {
  const supabase = await createClient();

  const [eventsRes, notesRes, usersRes] = await Promise.all([
    supabase
      .from("audit_events")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false }),
    supabase
      .from("order_notes")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false }),
    supabase.from("users").select("id, full_name, email"),
  ]);

  const actorNames: Record<string, string> = {};
  for (const u of usersRes.data ?? []) {
    actorNames[u.id] = u.full_name ?? u.email;
  }

  return {
    events: eventsRes.data ?? [],
    notes: notesRes.data ?? [],
    actorNames,
  };
}
