import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type VATimeEntryStatus = "pending" | "approved" | "rejected";

export interface VATimeEntry {
  id: string;
  va_id: string;
  employer_id: string;
  job_id: string;
  clockify_time_entry_id: string;
  status: VATimeEntryStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_id: string | null;
  notes: string | null;
}

export async function insertTimeEntry(
  entry: Omit<
    VATimeEntry,
    "id" | "submitted_at" | "reviewed_at" | "reviewer_id"
  >
) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("va_time_entries")
    .insert([{ ...entry }])
    .select()
    .single();
  if (error) throw error;
  return data as VATimeEntry;
}

export async function getTimeEntriesForEmployer(
  employer_id: string,
  job_id?: string
) {
  const supabase = createSupabaseBrowserClient();
  let query = supabase
    .from("va_time_entries")
    .select("*", { count: "exact" })
    .eq("employer_id", employer_id);
  if (job_id) query = query.eq("job_id", job_id);
  const { data, error } = await query.order("submitted_at", {
    ascending: false,
  });
  if (error) throw error;
  return data as VATimeEntry[];
}

export async function updateTimeEntryStatus(
  id: string,
  status: VATimeEntryStatus,
  reviewer_id: string,
  notes?: string
) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("va_time_entries")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewer_id,
      notes: notes || null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as VATimeEntry;
}
