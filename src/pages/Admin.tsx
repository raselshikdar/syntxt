import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Shield, ShieldOff, Users, FileText, Flag, Ban, Clock, CheckCircle, XCircle } from 'lucide-react';
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

interface ReportRow {
  id: string;
  reporter_handle: string;
  post_id: string;
  post_content: string;
  post_handle: string;
  reason: string;
  status: string;
  created_at: string;
}

interface RestrictionRow {
  id: string;
  user_id: string;
  handle: string;
  restriction_type: string;
  reason: string;
  expires_at: string | null;
  created_at: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'users' | 'posts' | 'reports' | 'restrictions'>('users');
  const [restrictDialog, setRestrictDialog] = useState<{ userId: string; handle: string } | null>(null);
  const [restrictType, setRestrictType] = useState('suspended');
  const [restrictReason, setRestrictReason] = useState('');
  const [restrictExpiry, setRestrictExpiry] = useState('');

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

  const { data: reports = [] as ReportRow[] } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data } = await supabase
        .from('reports')
        .select('id, reporter_id, post_id, reason, status, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!data) return [];

      const reporterIds = [...new Set((data as any[]).map(r => r.reporter_id))];
      const postIds = [...new Set((data as any[]).map(r => r.post_id))];

      const { data: profiles } = await supabase.from('profiles').select('user_id, handle').in('user_id', reporterIds);
      const reporterMap = new Map(profiles?.map(p => [p.user_id, p.handle]) ?? []);

      const { data: postsData } = await supabase.from('posts').select('id, content, user_id').in('id', postIds);
      const postMap = new Map(postsData?.map(p => [p.id, p]) ?? []);

      const postUserIds = [...new Set(postsData?.map(p => p.user_id) ?? [])];
      const { data: postProfiles } = postUserIds.length > 0
        ? await supabase.from('profiles').select('user_id, handle').in('user_id', postUserIds)
        : { data: [] };
      const postHandleMap = new Map<string, string>(postProfiles?.map(p => [p.user_id, p.handle] as [string, string]) ?? []);

      return (data as any[]).map(r => {
        const post = postMap.get(r.post_id);
        return {
          id: r.id,
          reporter_handle: reporterMap.get(r.reporter_id) ?? 'unknown',
          post_id: r.post_id,
          post_content: post?.content ?? '[deleted]',
          post_handle: post ? (postHandleMap.get(post.user_id) ?? 'unknown') as string : 'unknown',
          reason: r.reason ?? '',
          status: r.status,
          created_at: r.created_at,
        } as ReportRow;
      });
    },
    enabled: !!isAdmin,
  });

  const { data: restrictions = [] as RestrictionRow[] } = useQuery({
    queryKey: ['admin-restrictions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_restrictions')
        .select('id, user_id, restriction_type, reason, expires_at, created_at')
        .order('created_at', { ascending: false });
      if (!data) return [];
      const userIds = [...new Set((data as any[]).map(r => r.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, handle').in('user_id', userIds);
      const handleMap = new Map(profiles?.map(p => [p.user_id, p.handle]) ?? []);
      return (data as any[]).map(r => ({ ...r, handle: handleMap.get(r.user_id) ?? 'unknown' }));
    },
    enabled: !!isAdmin,
  });

  const deletePost = async (postId: string) => {
    await supabase.from('likes').delete().eq('post_id', postId);
    await supabase.from('saves').delete().eq('post_id', postId);
    await supabase.from('notifications').delete().eq('post_id', postId);
    await supabase.from('reports').delete().eq('post_id', postId);
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) toast.error(error.message);
    else { toast.success('Post deleted'); qc.invalidateQueries({ queryKey: ['admin-posts'] }); qc.invalidateQueries({ queryKey: ['admin-reports'] }); }
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

  const updateReportStatus = async (reportId: string, status: string) => {
    await supabase.from('reports').update({ status, reviewed_by: user?.id } as any).eq('id', reportId);
    qc.invalidateQueries({ queryKey: ['admin-reports'] });
    toast.success(`Report ${status}`);
  };

  const addRestriction = async () => {
    if (!restrictDialog || !user) return;
    const insertData: any = {
      user_id: restrictDialog.userId,
      restriction_type: restrictType,
      reason: restrictReason,
      created_by: user.id,
    };
    if (restrictExpiry) insertData.expires_at = new Date(restrictExpiry).toISOString();
    await supabase.from('user_restrictions').insert(insertData);
    qc.invalidateQueries({ queryKey: ['admin-restrictions'] });
    setRestrictDialog(null);
    setRestrictReason('');
    setRestrictExpiry('');
    toast.success('Restriction applied');
  };

  const removeRestriction = async (id: string) => {
    await supabase.from('user_restrictions').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-restrictions'] });
    toast.success('Restriction removed');
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

  const tabs = [
    { key: 'users' as const, icon: <Users size={14} />, label: 'Users' },
    { key: 'posts' as const, icon: <FileText size={14} />, label: 'Posts' },
    { key: 'reports' as const, icon: <Flag size={14} />, label: 'Reports' },
    { key: 'restrictions' as const, icon: <Ban size={14} />, label: 'Restrictions' },
  ];

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
        <div className="flex gap-2 flex-wrap">
          {tabs.map(t => (
            <motion.button
              key={t.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-label transition-colors ${
                tab === t.key ? 'bg-pill-active text-pill-active-foreground' : 'bg-pill-inactive text-pill-inactive-foreground'
              }`}
            >
              {t.icon}
              {t.label}
              {t.key === 'reports' && reports.filter(r => r.status === 'pending').length > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[9px] px-1.5 py-0.5 rounded-full ml-1">
                  {reports.filter(r => r.status === 'pending').length}
                </span>
              )}
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
                <div className="flex items-center gap-1">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setRestrictDialog({ userId: u.user_id, handle: u.handle })}
                    className="p-2 rounded-md text-muted-foreground hover:bg-accent"
                    title="Add restriction"
                  >
                    <Ban size={16} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleAdmin(u.user_id, u.is_admin)}
                    className={`p-2 rounded-md transition-colors ${u.is_admin ? 'text-counter-warning hover:bg-accent' : 'text-muted-foreground hover:bg-accent'}`}
                    title={u.is_admin ? 'Remove admin' : 'Grant admin'}
                  >
                    {u.is_admin ? <ShieldOff size={16} /> : <Shield size={16} />}
                  </motion.button>
                </div>
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

        {tab === 'reports' && (
          <div className="border border-border rounded-md bg-card divide-y divide-border">
            {reports.map(r => (
              <div key={r.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-label font-bold ${r.status === 'pending' ? 'text-counter-warning' : r.status === 'reviewed' ? 'text-handle' : 'text-muted-foreground'}`}>
                      {r.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">by @{r.reporter_handle}</span>
                  </div>
                </div>
                <div className="bg-accent/50 rounded-md p-3">
                  <span className="text-xs text-handle font-semibold">@{r.post_handle}</span>
                  <p className="text-sm text-card-foreground mt-1 line-clamp-3">{r.post_content}</p>
                </div>
                {r.reason && <p className="text-xs text-muted-foreground">Reason: {r.reason}</p>}
                {r.status === 'pending' && (
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateReportStatus(r.id, 'reviewed')}
                      className="flex items-center gap-1 text-xs text-handle hover:bg-accent px-3 py-1.5 rounded-md"
                    >
                      <CheckCircle size={12} /> Mark Reviewed
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateReportStatus(r.id, 'dismissed')}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:bg-accent px-3 py-1.5 rounded-md"
                    >
                      <XCircle size={12} /> Dismiss
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => deletePost(r.post_id)}
                      className="flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md"
                    >
                      <Trash2 size={12} /> Delete Post
                    </motion.button>
                  </div>
                )}
              </div>
            ))}
            {reports.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No reports yet.</p>
            )}
          </div>
        )}

        {tab === 'restrictions' && (
          <div className="border border-border rounded-md bg-card divide-y divide-border">
            {restrictions.map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-handle font-semibold">@{r.handle}</span>
                    <span className="text-[10px] uppercase tracking-label text-destructive font-bold">{r.restriction_type}</span>
                  </div>
                  {r.reason && <p className="text-[10px] text-muted-foreground truncate">{r.reason}</p>}
                  {r.expires_at && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock size={10} /> Expires: {new Date(r.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeRestriction(r.id)}
                  className="text-destructive hover:bg-destructive/10 p-2 rounded-md shrink-0"
                  title="Remove restriction"
                >
                  <XCircle size={16} />
                </motion.button>
              </div>
            ))}
            {restrictions.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No active restrictions.</p>
            )}
          </div>
        )}
      </div>

      {/* Restrict Dialog */}
      {restrictDialog && (
        <>
          <div className="fixed inset-0 bg-foreground/20 z-40" onClick={() => setRestrictDialog(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-md p-5 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-bold">Restrict @{restrictDialog.handle}</h3>
              <select
                value={restrictType}
                onChange={e => setRestrictType(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="suspended">Suspended</option>
                <option value="post_restricted">Cannot Post</option>
                <option value="like_restricted">Cannot Like</option>
                <option value="reply_restricted">Cannot Reply</option>
                <option value="repost_restricted">Cannot Repost</option>
              </select>
              <textarea
                value={restrictReason}
                onChange={e => setRestrictReason(e.target.value)}
                placeholder="Reason (optional)"
                className="w-full bg-background border border-border rounded-md p-3 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[60px]"
                maxLength={500}
              />
              <input
                type="date"
                value={restrictExpiry}
                onChange={e => setRestrictExpiry(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Expiry (leave empty for permanent)"
              />
              <p className="text-[10px] text-muted-foreground">Leave expiry empty for permanent restriction.</p>
              <div className="flex justify-end gap-2">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setRestrictDialog(null)} className="text-xs text-muted-foreground px-3 py-1.5">
                  Cancel
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={addRestriction} className="bg-destructive text-destructive-foreground text-xs font-semibold px-4 py-1.5 rounded-md">
                  Apply Restriction
                </motion.button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
