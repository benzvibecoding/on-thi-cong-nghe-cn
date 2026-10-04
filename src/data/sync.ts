import type { SupabaseClient } from "@supabase/supabase-js";
import type { PracticeEventRow } from "./db";
import { getDb } from "./db";

export interface SyncEventRow {
  id: string;
  question_id: string;
  topic_id: string;
  level: string;
  qtype: string;
  correct: boolean;
  correct_count: number | null;
  duration_ms: number;
  created_at: number;
}

/** Map a local event to the cloud row shape (pure, tested). */
export function toSyncRow(userId: string, e: PracticeEventRow): SyncEventRow & { user_id: string } {
  return {
    id: e.id,
    user_id: userId,
    question_id: e.questionId,
    topic_id: e.topicId,
    level: e.level,
    qtype: e.qtype,
    correct: e.correct,
    correct_count: e.correctCount ?? null,
    duration_ms: e.durationMs,
    created_at: e.createdAt,
  };
}

/** Settings merge: last-write-wins by updatedAt (pure, tested). */
export function mergeSettings(
  local: { data: Record<string, unknown>; updatedAt: number },
  remote: { data: Record<string, unknown>; updatedAt: number }
): Record<string, unknown> {
  return remote.updatedAt >= local.updatedAt ? remote.data : local.data;
}

/** Push local events (idempotent upsert on client-generated id). */
export async function pushEvents(
  client: SupabaseClient,
  userId: string,
  events: PracticeEventRow[]
): Promise<{ pushed: number }> {
  if (events.length === 0) return { pushed: 0 };
  const rows = events.map((e) => toSyncRow(userId, e));
  const { error } = await client.from("practice_events").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(error.message);
  return { pushed: rows.length };
}

/** Pull events created after `since` (append-only merge client-side). */
export async function pullEvents(
  client: SupabaseClient,
  since: number
): Promise<SyncEventRow[]> {
  const { data, error } = await client
    .from("practice_events")
    .select("id,question_id,topic_id,level,qtype,correct,correct_count,duration_ms,created_at")
    .gt("created_at", since)
    .order("created_at", { ascending: true })
    .limit(1000);
  if (error) throw new Error(error.message);
  return (data ?? []) as SyncEventRow[];
}

export async function getLocalEvents(): Promise<PracticeEventRow[]> {
  return getDb().practiceEvents.orderBy("createdAt").toArray();
}
