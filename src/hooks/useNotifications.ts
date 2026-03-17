import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUnreadCount() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [realtimeCount, setRealtimeCount] = useState<number | null>(null);

  const { data: fetchedCount = 0 } = useQuery({
    queryKey: ['unread-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          setRealtimeCount(prev => (prev ?? fetchedCount) + 1);
          qc.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['unread-count'] });
          setRealtimeCount(null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchedCount, qc]);

  const resetCount = () => {
    setRealtimeCount(null);
    qc.invalidateQueries({ queryKey: ['unread-count'] });
  };

  return { count: realtimeCount ?? fetchedCount, resetCount };
}
