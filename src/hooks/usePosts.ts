import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PostWithProfile {
  id: string;
  user_id: string;
  content: string;
  repost_of: string | null;
  reply_to: string | null;
  created_at: string;
  handle: string;
  image_url: string | null;
  like_count: number;
  repost_count: number;
  reply_count: number;
  liked_by_me: boolean;
  saved_by_me: boolean;
  reposted_by_me: boolean;
  original_content?: string;
  original_handle?: string;
  verified?: boolean;
}

async function fetchPosts(userId: string | undefined): Promise<PostWithProfile[]> {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, user_id, content, repost_of, reply_to, created_at, image_url')
    .is('reply_to', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !posts) return [];

  const userIds = [...new Set(posts.map(p => p.user_id))];
  const { data: profiles } = await supabase.from('profiles').select('user_id, handle').in('user_id', userIds);
  const profileMap = new Map(profiles?.map(p => [p.user_id, p.handle]) ?? []);

  const postIds = posts.map(p => p.id);
  const { data: likes } = await supabase.from('likes').select('post_id, user_id').in('post_id', postIds);
  const { data: saves } = userId
    ? await supabase.from('saves').select('post_id').eq('user_id', userId).in('post_id', postIds)
    : { data: [] };

  const { data: replyCounts } = await supabase.from('posts').select('reply_to').in('reply_to', postIds);
  const replyCountMap = new Map<string, number>();
  replyCounts?.forEach(r => {
    if (r.reply_to) replyCountMap.set(r.reply_to, (replyCountMap.get(r.reply_to) ?? 0) + 1);
  });

  const repostIds = posts.filter(p => p.repost_of).map(p => p.repost_of!);
  let originalMap = new Map<string, { content: string; user_id: string }>();
  if (repostIds.length > 0) {
    const { data: originals } = await supabase.from('posts').select('id, content, user_id').in('id', repostIds);
    originals?.forEach(o => originalMap.set(o.id, { content: o.content, user_id: o.user_id }));
    const origUserIds = [...new Set(originals?.map(o => o.user_id) ?? [])];
    if (origUserIds.length > 0) {
      const { data: origProfiles } = await supabase.from('profiles').select('user_id, handle').in('user_id', origUserIds);
      origProfiles?.forEach(p => profileMap.set(p.user_id, p.handle));
    }
  }

  const likesByPost = new Map<string, string[]>();
  likes?.forEach(l => {
    const arr = likesByPost.get(l.post_id) ?? [];
    arr.push(l.user_id);
    likesByPost.set(l.post_id, arr);
  });

  const savedSet = new Set(saves?.map(s => s.post_id) ?? []);
  const repostCountMap = new Map<string, number>();
  posts.forEach(p => {
    if (p.repost_of) {
      repostCountMap.set(p.repost_of, (repostCountMap.get(p.repost_of) ?? 0) + 1);
    }
  });

  return posts.map(p => {
    const postLikes = likesByPost.get(p.id) ?? [];
    const original = p.repost_of ? originalMap.get(p.repost_of) : null;
    return {
      ...p,
      image_url: (p as any).image_url ?? null,
      handle: profileMap.get(p.user_id) ?? 'unknown',
      like_count: postLikes.length,
      repost_count: repostCountMap.get(p.id) ?? 0,
      reply_count: replyCountMap.get(p.id) ?? 0,
      liked_by_me: userId ? postLikes.includes(userId) : false,
      saved_by_me: savedSet.has(p.id),
      reposted_by_me: userId ? posts.some(rp => rp.repost_of === p.id && rp.user_id === userId) : false,
      original_content: original?.content,
      original_handle: original ? profileMap.get(original.user_id) : undefined,
    };
  });
}

export function usePosts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['posts', user?.id],
    queryFn: () => fetchPosts(user?.id),
    staleTime: 30000,
    refetchInterval: 30000,
  });
}

export function useUserPosts(userId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-posts', userId, user?.id],
    queryFn: async () => {
      if (!userId) return [];
      const all = await fetchPosts(user?.id);
      return all.filter(p => p.user_id === userId);
    },
    enabled: !!userId,
  });
}

export function useSavedPosts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['saved-posts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: saves } = await supabase.from('saves').select('post_id').eq('user_id', user.id);
      if (!saves?.length) return [];
      const postIds = saves.map(s => s.post_id);
      const all = await fetchPosts(user.id);
      return all.filter(p => postIds.includes(p.id));
    },
    enabled: !!user,
  });
}
