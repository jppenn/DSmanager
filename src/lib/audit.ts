import { createClient } from "@/lib/supabase/server";
import type { EntityType } from "@/lib/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

interface AuditInput {
  entityType: EntityType;
  entityId: string;
  actorId: string | null;
  action: string;
  metadata?: Record<string, unknown>;
}

/**
 * Records an audit event. Uses the provided client (so RLS applies with the
 * acting user's session) or creates a server client.
 */
export async function logAudit(
  input: AuditInput,
  client?: SupabaseClient<Database>,
): Promise<void> {
  const supabase = client ?? (await createClient());
  await supabase.from("audit_events").insert({
    entity_type: input.entityType,
    entity_id: input.entityId,
    actor_id: input.actorId,
    action: input.action,
    metadata: input.metadata ?? {},
  });
}
