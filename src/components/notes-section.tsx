"use client";

import { useActionState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { formatDateTime } from "@/lib/utils";
import type { OrderNote } from "@/lib/types/database";

interface NoteFormState {
  error?: string;
}

export function NotesSection({
  notes,
  authorNames,
  action,
}: {
  notes: OrderNote[];
  authorNames: Record<string, string>;
  action: (prev: NoteFormState, fd: FormData) => Promise<NoteFormState>;
}) {
  const [state, formAction] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-4">
      <form ref={formRef} action={formAction} className="space-y-2">
        <Textarea name="body" placeholder="Add a note..." required />
        {state.error && (
          <p className="text-xs text-destructive">{state.error}</p>
        )}
        <div className="flex justify-end">
          <SubmitButton size="sm">Add note</SubmitButton>
        </div>
      </form>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="rounded-md border border-border bg-secondary/30 p-3"
            >
              <p className="whitespace-pre-wrap text-sm">{note.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {note.author_id
                  ? (authorNames[note.author_id] ?? "Unknown")
                  : "System"}{" "}
                &middot; {formatDateTime(note.created_at)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
