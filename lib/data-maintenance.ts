"use client";

import { registerSyncHandler, replaceDomainWithDeleteOperation } from "@/lib/sync-engine";
import { retrySupabaseMutation, supabase } from "@/lib/supabase";

async function deleteAllRemoteData() {
  if (!supabase) {
    return { ok: true };
  }

  const { error } = await supabase.rpc("clear_daily_note_data");

  if (error) {
    console.warn("Failed to delete all Daily Note data", error.message);
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export function clearAllRemoteData() {
  if (!supabase) {
    return Promise.resolve({ ok: true, queued: false });
  }

  return replaceDomainWithDeleteOperation(
    [
      "daily-upsert",
      "daily-delete-one",
      "daily-delete-all",
      "writing-upsert",
      "writing-delete-all",
      "weekly-upsert",
      "weekly-delete-all",
    ],
    "all-delete",
  );
}

registerSyncHandler("all-delete", () => retrySupabaseMutation(deleteAllRemoteData));
