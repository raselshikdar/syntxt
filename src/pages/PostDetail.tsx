import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import PostCard from '@/components/PostCard';
import BottomNav from '@/components/BottomNav';
import GuestBottomNav from '@/components/GuestBottomNav';
import type { PostWithProfile } from '@/hooks/usePosts';

function usePostDetail(postId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['post-detail', postId, user?.id],
    queryFn: async (): Promise<{ post: PostWithProfile | null; replies: PostWithProfile[] }> => {
      if (!postId) return { post: null, replies: [] };

      const { data: postRow } = await supabase.from('posts').select('*').eq('id', postId).single();
      if (!postRow) return { post: null, replies: [] };

      const { data: replies } = await supabase.from('posts').select('*').eq('reply_to', postId).order('created_at', { ascending: true });

      const allPosts = [postRow, ...(replies ?? [])];
      const userIds = [...new Set(allPosts.map(p => p.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, handle').in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.handle]) ?? []);

      const postIds = allPosts.map(p => p.id);
      const { data: likes } = await supabase.from('likes').select('post_id, user_id').in('post_id', postIds);
      const { data: saves } = user ? await supabase.from('saves').select('post_id').eq('user_id', user.id).in('post_id', postIds) : { data: [] };

      const likesByPost = new Map<string, string[]>();
      likes?.forEach(l => {
        const arr = likesByPost.get(l.post_id) ?? [];
        arr.push(l.user_id);
        likesByPost.set(l.post_id, arr);
      });
      const savedSet = new Set(saves?.map(s => s.post_id) ?? []);

      // Count replies for each post
      const { data: replyCounts } = await supabase.from('posts').select('reply_to').in('reply_to', postIds);
      const replyCountMap = new Map<string, number>();
      replyCounts?.forEach(r => {
        if (r.reply_to) replyCountMap.set(r.reply_to, (replyCountMap.get(r.reply_to) ?? 0) + 1);
      });

      const mapPost = (p: typeof postRow): PostWithProfile => {
        const postLikes = likesByPost.get(p.id) ?? [];
        return {
          id: p.id,
          user_id: p.user_id,
          content: p.content,
          repost_of: p.repost_of,
          reply_to: p.reply_to,
          created_at: p.created_at,
          handle: profileMap.get(p.user_id) ?? 'unknown',
          like_count: postLikes.length,
          repost_count: 0,
          reply_count: replyCountMap.get(p.id) ?? 0,
          liked_by_me: user ? postLikes.includes(user.id) : false,
          saved_by_me: savedSet.has(p.id),
          reposted_by_me: false,
        };
      };

      return {
        post: mapPost(postRow),
        replies: (replies ?? []).map(mapPost),
      };
    },
    enabled: !!postId,
  });
}

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = usePostDetail(postId);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </motion.button>
          <span className="text-sm font-bold">Signal</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>}
        {data?.post && <PostCard post={data.post} />}
        {data && data.replies.length > 0 && (
          <>
            <div className="text-xs uppercase tracking-label text-muted-foreground font-semibold px-1">
              {data.replies.length} {data.replies.length === 1 ? 'Reply' : 'Replies'}
            </div>
            {data.replies.map((reply, i) => (
              <PostCard key={reply.id} post={reply} index={i} />
            ))}
          </>
        )}
        {data && data.replies.length === 0 && data.post && (
          <p className="text-center text-muted-foreground text-sm py-8">No replies yet.</p>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
