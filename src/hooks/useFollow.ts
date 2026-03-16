import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useFollowStatus(targetUserId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['follow-status', user?.id, targetUserId],
    queryFn: async () => {
      if (!user || !targetUserId) return false;
      const { data } = await supabase.from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!targetUserId,
  });
}

export function useFollowCounts(userId: string | undefined) {
  return useQuery({
    queryKey: ['follow-counts', userId],
    queryFn: async () => {
      if (!userId) return { followers: 0, following: 0 };
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
      ]);
      return { followers: followers ?? 0, following: following ?? 0 };
    },
    enabled: !!userId,
  });
}

export function useFollowingIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['following-ids', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
      return data?.map(d => d.following_id) ?? [];
    },
    enabled: !!user,
  });
}

export function useToggleFollow() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return async (targetUserId: string) => {
    if (!user) return;
    const { data: existing } = await supabase.from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();

    if (existing) {
      await supabase.from('follows').delete().eq('id', existing.id);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
      await supabase.from('notifications').insert({ user_id: targetUserId, actor_id: user.id, type: 'follow' });
    }
    qc.invalidateQueries({ queryKey: ['follow-status'] });
    qc.invalidateQueries({ queryKey: ['follow-counts'] });
    qc.invalidateQueries({ queryKey: ['following-ids'] });
    qc.invalidateQueries({ queryKey: ['posts'] });
  };
}
