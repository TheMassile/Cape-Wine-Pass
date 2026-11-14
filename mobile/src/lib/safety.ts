// Safety: report, block and delete account.
// See supabase/migrations/20261114060000_report_block_delete.sql.
import { supabase } from './supabase';

export async function reportContent(input: { reportedUserId: string; checkinId?: string; reason: string }) {
  const { error } = await supabase.from('reports').insert({
    reported_user_id: input.reportedUserId,
    checkin_id: input.checkinId ?? null,
    reason: input.reason,
  });
  if (error) throw error;
}

export async function blockUser(targetId: string) {
  const { error } = await supabase.from('blocks').insert({ blocked_id: targetId });
  if (error && error.code !== '23505') throw error; // already blocked is fine
}

export async function unblockUser(myId: string, targetId: string) {
  const { error } = await supabase.from('blocks').delete().eq('blocker_id', myId).eq('blocked_id', targetId);
  if (error) throw error;
}

export async function fetchBlocked(myId: string): Promise<string[]> {
  const { data, error } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', myId);
  if (error) throw error;
  return (data ?? []).map((r) => r.blocked_id as string);
}

export async function deleteMyAccount() {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  await supabase.auth.signOut();
}
