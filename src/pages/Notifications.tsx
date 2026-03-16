import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, Repeat, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

interface Notification {
  id: string;
  type: string;
  actor_handle: string;
  post_id: string | null;
  read: boolean;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const iconMap: Record<string, React.ReactNode> = {
  like: <Heart size={14} className="text-handle" />,
  repost: <Repeat size={14} className="text-handle" />,
  follow: <UserPlus size={14} className="text-handle" />,
  reply: <Heart size={14} className="text-handle" />,
};

const labelMap: Record<string, string> = {
  like: 'liked your post',
  repost: 'reposted your signal',
  follow: 'started following you',
  reply: 'replied to your post',
};

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('notifications')
        .select('id, type, actor_id, post_id, read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!data?.length) return [];

      const actorIds = [...new Set(data.map(n => n.actor_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, handle').in('user_id', actorIds);
      const handleMap = new Map(profiles?.map(p => [p.user_id, p.handle]) ?? []);

      // Mark as read
      const unreadIds = data.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
      }

      return data.map(n => ({
        id: n.id,
        type: n.type,
        actor_handle: handleMap.get(n.actor_id) ?? 'unknown',
        post_id: n.post_id,
        read: n.read,
        created_at: n.created_at,
      }));
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        <h2 className="text-xs uppercase tracking-label text-muted-foreground font-semibold">Notifications</h2>
        {isLoading ? (
          <p className="text-center text-muted-foreground text-sm py-16">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-16">No notifications yet.</p>
        ) : (
          <div className="border border-border rounded-md bg-card divide-y divide-border">
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => n.type === 'follow' ? navigate(`/u/${n.actor_handle}`) : undefined}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent transition-colors ${!n.read ? 'bg-accent/50' : ''}`}
              >
                {iconMap[n.type]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    <span className="text-handle font-semibold">@{n.actor_handle}</span>{' '}
                    <span className="text-muted-foreground">{labelMap[n.type]}</span>
                  </p>
                </div>
                <span className="text-[10px] text-timestamp uppercase tracking-label shrink-0">{timeAgo(n.created_at)}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
