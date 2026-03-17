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
    queryFn: async (): Promise<{ post: PostWithProfile | null; replies: PostWithProfile[]; parentPosts: PostWithProfile[] }> => {
      if (!postId) return { post: null, replies: [], parentPosts: [] };

      // ১. বর্তমান পোস্টটি ফেচ করা
      const { data: postRow } = await supabase.from('posts').select('*').eq('id', postId).single();
      if (!postRow) return { post: null, replies: [], parentPosts: [] };

      // ২. প্যারেন্ট চেইন খুঁজে বের করা (মেইন পোস্ট সবসময় উপরে রাখার জন্য)
      let parentPosts: any[] = [];
      let currentParentId = postRow.reply_to;
      
      while (currentParentId) {
        const { data: parent } = await supabase.from('posts').select('*').eq('id', currentParentId).single();
        if (parent) {
          parentPosts.unshift(parent); // অ্যারের শুরুতে যোগ করা যাতে ক্রম ঠিক থাকে
          currentParentId = parent.reply_to;
        } else {
          currentParentId = null;
        }
      }

      // ৩. রিপ্লাইগুলো ফেচ করা
      const { data: replies } = await supabase.from('posts')
        .select('*')
        .eq('reply_to', postId)
        .order('created_at', { ascending: true });

      // ৪. রিপোস্টের ক্ষেত্রে অরিজিনাল পোস্টগুলো ফেচ করা
      const allFetchedRows = [postRow, ...parentPosts, ...(replies ?? [])];
      const repostIds = allFetchedRows.filter(p => p.repost_of).map(p => p.repost_of);
      
      let originalPostsMap = new Map();
      if (repostIds.length > 0) {
        const { data: originals } = await supabase.from('posts').select('*').in('id', repostIds);
        originals?.forEach(op => originalPostsMap.set(op.id, op));
      }

      // ৫. প্রোফাইল এবং লাইক/সেভ ডাটা প্রসেসিং (আপনার অরিজিনাল লজিক অক্ষত)
      const userIds = [...new Set([...allFetchedRows.map(p => p.user_id), ...Array.from(originalPostsMap.values()).map(p => p.user_id)])];
      const { data: profiles } = await supabase.from('profiles').select('user_id, handle').in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.handle]) ?? []);

      const postIds = [...allFetchedRows.map(p => p.id), ...repostIds];
      const { data: likes } = await supabase.from('likes').select('post_id, user_id').in('post_id', postIds);
      const { data: saves } = user ? await supabase.from('saves').select('post_id').eq('user_id', user.id).in('post_id', postIds) : { data: [] };
      const { data: replyCounts } = await supabase.from('posts').select('reply_to').in('reply_to', postIds);

      const likesByPost = new Map<string, string[]>();
      likes?.forEach(l => {
        const arr = likesByPost.get(l.post_id) ?? [];
        arr.push(l.user_id);
        likesByPost.set(l.post_id, arr);
      });
      const savedSet = new Set(saves?.map(s => s.post_id) ?? []);
      const replyCountMap = new Map<string, number>();
      replyCounts?.forEach(r => {
        if (r.reply_to) replyCountMap.set(r.reply_to, (replyCountMap.get(r.reply_to) ?? 0) + 1);
      });

      const mapPost = (p: any): PostWithProfile => {
        const postLikes = likesByPost.get(p.id) ?? [];
        const originalPostData = p.repost_of ? originalPostsMap.get(p.repost_of) : null;
        
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
          // PostCard-এর জন্য অরিজিনাল পোস্ট ডাটা পাঠানো হচ্ছে
          original_post: originalPostData ? {
            ...originalPostData,
            handle: profileMap.get(originalPostData.user_id) ?? 'unknown'
          } : undefined
        } as PostWithProfile;
      };

      return {
        post: mapPost(postRow),
        replies: (replies ?? []).map(mapPost),
        parentPosts: parentPosts.map(mapPost)
      };
    },
    enabled: !!postId,
  });
}

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
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
        
        {/* সবার উপরে প্যারেন্ট বা মেইন পোস্টগুলো দেখাবে */}
        {data?.parentPosts.map((p) => (
          <div key={p.id} className="opacity-80 scale-[0.98]">
            <PostCard post={p} />
            <div className="h-4 w-px bg-border ml-6 my-1" /> {/* থ্রেড লাইন */}
          </div>
        ))}

        {/* বর্তমান টার্গেটেড পোস্ট */}
        {data?.post && <PostCard post={data.post} />}

        {/* রিপ্লাই সেকশন */}
        {data && data.replies.length > 0 && (
          <>
            <div className="text-xs uppercase tracking-label text-muted-foreground font-semibold px-1 pt-4">
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
      {user ? <BottomNav /> : <GuestBottomNav />}
    </div>
  );
}
