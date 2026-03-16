import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Shield, ShieldOff, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UserRow {
  user_id: string;
  handle: string;
  bio: string | null;
  created_at: string;
  is_admin: boolean;
}

interface PostRow {
  id: string;
  content: string;
  user_id: string;
  handle: string;
  created_at: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'users' | 'posts'>('users');

  // Check if current user is admin
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const { data: users = [] } = useQuery<UserRow[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles } = await supabase.from('profiles').select('user_id, handle, bio, created_at');
      if (!profiles) return [];
      const { data: roles } = await supabase.from('user_roles').select('user_id, role').eq('role', 'admin');
      const adminSet = new Set(roles?.map(r => r.user_id) ?? []);
      return profiles.map(p => ({ ...p, is_admin: adminSet.has(p.user_id) }));
    },
    enabled: !!isAdmin,
  });

  const { data: posts = [] } = useQuery<PostRow[]>({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts')
        .select('id, content, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!data) return [];
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, handle').in('user_id', userIds);
      const handleMap = new Map(profiles?.map(p => [p.user_id, p.handle]) ?? []);
      return data.map(p => ({ ...p, handle: handleMap.get(p.user_id) ?? 'unknown' }));
    },
    enabled: !!isAdmin,
  });

  const deletePost = async (postId: string) => {
    // Admin deletes: need service role, but we can delete via RLS if we add policy
    // For now, let's use a workaround - delete likes/saves first, then post
    await supabase.from('likes').delete().eq('post_id', postId);
    await supabase.from('saves').delete().eq('post_id', postId);
    await supabase.from('notifications').delete().eq('post_id', postId);
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) toast.error(error.message);
    else { toast.success('Post deleted'); qc.invalidateQueries({ queryKey: ['admin-posts'] }); }
  };

  const toggleAdmin = async (targetUserId: string, currentlyAdmin: boolean) => {
    if (currentlyAdmin) {
      await supabase.from('user_roles').delete().eq('user_id', targetUserId).eq('role', 'admin');
    } else {
      await supabase.from('user_roles').insert({ user_id: targetUserId, role: 'admin' });
    }
    qc.invalidateQueries({ queryKey: ['admin-users'] });
    toast.success(currentlyAdmin ? 'Admin removed' : 'Admin granted');
  };

  if (checkingAdmin) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm font-mono">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm font-mono">
        Access denied. Admins only.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 h-14">
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
          </motion.button>
          <span className="text-sm font-bold">Admin Panel</span>
          <span className="text-[10px] uppercase tracking-label text-handle ml-auto">syntxt_</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {/* Tab switcher */}
        <div className="flex gap-2">
          {(['users', 'posts'] as const).map(t => (
            <motion.button
              key={t}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-label transition-colors ${
                tab === t ? 'bg-pill-active text-pill-active-foreground' : 'bg-pill-inactive text-pill-inactive-foreground'
              }`}
            >
              {t === 'users' ? <Users size={14} /> : <FileText size={14} />}
              {t}
            </motion.button>
          ))}
        </div>

        {tab === 'users' && (
          <div className="border border-border rounded-md bg-card divide-y divide-border">
            {users.map(u => (
              <div key={u.user_id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <span
                    onClick={() => navigate(`/u/${u.handle}`)}
                    className="text-sm text-handle font-semibold cursor-pointer hover:underline"
                  >
                    @{u.handle}
                  </span>
                  {u.is_admin && (
                    <span className="ml-2 text-[10px] uppercase tracking-label text-counter-warning font-bold">admin</span>
                  )}
                  <p className="text-[10px] text-muted-foreground truncate">{u.bio || 'No bio'}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleAdmin(u.user_id, u.is_admin)}
                  className={`p-2 rounded-md transition-colors ${u.is_admin ? 'text-counter-warning hover:bg-accent' : 'text-muted-foreground hover:bg-accent'}`}
                  title={u.is_admin ? 'Remove admin' : 'Grant admin'}
                >
                  {u.is_admin ? <ShieldOff size={16} /> : <Shield size={16} />}
                </motion.button>
              </div>
            ))}
          </div>
        )}

        {tab === 'posts' && (
          <div className="border border-border rounded-md bg-card divide-y divide-border">
            {posts.map(p => (
              <div key={p.id} className="flex items-start justify-between px-4 py-3 gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-handle font-semibold">@{p.handle}</span>
                  <p className="text-sm text-card-foreground mt-1 line-clamp-2">{p.content}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => deletePost(p.id)}
                  className="text-destructive hover:bg-destructive/10 p-2 rounded-md shrink-0"
                  title="Delete post"
                >
                  <Trash2 size={16} />
                </motion.button>
              </div>
            ))}
            {posts.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No posts yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
