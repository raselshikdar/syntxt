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
    // হুকের optimisticUpdate-এর সাথে মিল রাখতে Key এবংpostId ব্যবহার করা হয়েছে
    queryKey: ['post-detail'], 
    queryFn: async (): Promise<PostWithProfile[]> => { 
      if (!postId) return []; 

      // ১. মেইন পোস্ট আনা
      const { data: postRow } = await supabase.from('posts').select('*').eq('id', postId).single(); 
      if (!postRow) return []; 

      // ২. প্যারেন্ট এবং রিপ্লাই ডাটা আনা
      let parentRows: any[] = []; 
      let currentParentId = postRow.reply_to; 
      while (currentParentId) { 
        const { data: pRow } = await supabase.from('posts').select('*').eq('id', currentParentId).single(); 
        if (pRow) { parentRows.unshift(pRow); currentParentId = pRow.reply_to; } else break; 
      } 
      const { data: replies } = await supabase.from('posts').select('*').eq('reply_to', postId).order('created_at', { ascending: true }); 

      const allRows = [postRow, ...parentRows, ...(replies ?? [])]; 
      
      // ৩. প্রোফাইল এবং ইন্টারঅ্যাকশন ম্যাপিং (আপনার অরিজিনাল লজিক)
      const userIds = [...new Set(allRows.map(p => p.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, handle').in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.handle]) ?? []);
      
      const postIds = allRows.map(p => p.id);
      const { data: likes } = await supabase.from('likes').select('post_id, user_id').in('post_id', postIds);
      const { data: saves } = user ? await supabase.from('saves').select('post_id').eq('user_id', user.id).in('post_id', postIds) : { data: [] };
      const savedSet = new Set(saves?.map(s => s.post_id) ?? []);

      const { data: replyCounts } = await supabase.from('posts').select('reply_to').in('reply_to', postIds);
      const replyCountMap = new Map<string, number>();
      replyCounts?.forEach(r => { if (r.reply_to) replyCountMap.set(r.reply_to, (replyCountMap.get(r.reply_to) ?? 0) + 1); });

      // ৪. Array হিসেবে ডাটা রিটার্ন করা (যাতে হুক এটি আপডেট করতে পারে)
      return allRows.map((p): PostWithProfile => {
        const postLikes = likes?.filter(l => l.post_id === p.id).map(l => l.user_id) ?? [];
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
      });
    }, 
    enabled: !!postId,
    staleTime: 0, // দ্রুত রিফ্রেশের জন্য
  }); 
} 

export default function PostDetail() { 
  const { postId } = useParams<{ postId: string }>(); 
  const navigate = useNavigate(); 
  const { user } = useAuth(); 
  const { data: allPosts = [], isLoading } = usePostDetail(postId); 

  // মেইন পোস্ট, প্যারেন্ট এবং রিপ্লাই আলাদা করা (ডিজাইন ঠিক রাখতে)
  const mainPost = allPosts.find(p => p.id === postId);
  const replies = allPosts.filter(p => p.reply_to === postId);
  const parentPosts = allPosts.filter(p => p.id !== postId && p.reply_to !== postId);

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
        {parentPosts.map(p => <PostCard key={p.id} post={p} />)} 
        {mainPost && <PostCard post={mainPost} />} 
        {replies.length > 0 && ( 
          <> 
            <div className="text-xs uppercase tracking-label text-muted-foreground font-semibold px-1"> 
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'} 
            </div> 
            {replies.map((reply, i) => ( 
              <PostCard key={reply.id} post={reply} index={i} /> 
            ))} 
          </> 
        )} 
        {!isLoading && replies.length === 0 && mainPost && ( 
          <p className="text-center text-muted-foreground text-sm py-8">No replies yet.</p> 
        )} 
      </div> 
      {user ? <BottomNav /> : <GuestBottomNav />} 
    </div> 
  ); 
}
