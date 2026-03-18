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
    // হুকের invalidate লজিকের সাথে মিল রেখে 'post-detail' এবং আলাদা করার জন্য postId ব্যবহার করা হয়েছে
    queryKey: ['post-detail', postId], 
    queryFn: async (): Promise<{ post: PostWithProfile | null; replies: PostWithProfile[]; parentPosts: PostWithProfile[] }> => { 
      if (!postId) return { post: null, replies: [], parentPosts: [] }; 

      const { data: postRow } = await supabase.from('posts').select('*').eq('id', postId).single(); 
      if (!postRow) return { post: null, replies: [], parentPosts: [] }; 

      let parentRows: any[] = []; 
      let currentParentId = postRow.reply_to; 
      while (currentParentId) { 
        const { data: pRow } = await supabase.from('posts').select('*').eq('id', currentParentId).single(); 
        if (pRow) { 
          parentRows.unshift(pRow); 
          currentParentId = pRow.reply_to; 
        } else break; 
      } 

      const { data: replies } = await supabase.from('posts').select('*').eq('reply_to', postId).order('created_at', { ascending: true }); 

      const allRows = [postRow, ...parentRows, ...(replies ?? [])]; 
      const repostIds = allRows.filter(r => r.repost_of).map(r => r.repost_of); 
      let originalsMap = new Map(); 
      if (repostIds.length > 0) { 
        const { data: originals } = await supabase.from('posts').select('*').in('id', repostIds); 
        originals?.forEach(o => originalsMap.set(o.id, o)); 
      } 

      const userIds = [...new Set([...allRows.map(p => p.user_id), ...Array.from(originalsMap.values()).map(o => o.user_id)])]; 
      const { data: profiles } = await supabase.from('profiles').select('user_id, handle').in('user_id', userIds); 
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.handle]) ?? []); 

      const postIds = [...allRows.map(p => p.id), ...repostIds]; 
      const { data: likes } = await supabase.from('likes').select('post_id, user_id').in('post_id', postIds); 
      const { data: saves } = user ? await supabase.from('saves').select('post_id').eq('user_id', user.id).in('post_id', postIds) : { data: [] }; 

      const likesByPost = new Map<string, string[]>(); 
      likes?.forEach(l => { 
        const arr = likesByPost.get(l.post_id) ?? []; 
        arr.push(l.user_id); 
        likesByPost.set(l.post_id, arr); 
      }); 
      const savedSet = new Set(saves?.map(s => s.post_id) ?? []); 

      const { data: replyCounts } = await supabase.from('posts').select('reply_to').in('reply_to', postIds); 
      const replyCountMap = new Map<string, number>(); 
      replyCounts?.forEach(r => { 
        if (r.reply_to) replyCountMap.set(r.reply_to, (replyCountMap.get(r.reply_to) ?? 0) + 1); 
      }); 

      const mapPost = (p: any): PostWithProfile => { 
        const postLikes = likesByPost.get(p.id) ?? []; 
        const originalData = p.repost_of ? originalsMap.get(p.repost_of) : null; 
        return { 
          id: p.id, 
          user_id: p.user_id, 
          content: p.content, 
          repost_of: p.repost_of, 
          reply_to: p.reply_to, 
          created_at: p.created_at, 
          handle: profileMap.get(p.user_id) ?? 'unknown', 
          image_url: p.image_url ?? null, 
          like_count: postLikes.length, 
          repost_count: 0, 
          reply_count: replyCountMap.get(p.id) ?? 0, 
          liked_by_me: user ? postLikes.includes(user.id) : false, 
          saved_by_me: savedSet.has(p.id), 
          reposted_by_me: false, 
          original_content: originalData ? originalData.content : undefined, 
          original_handle: originalData ? (profileMap.get(originalData.user_id) ?? 'unknown') : undefined 
        }; 
      }; 

      return { 
        post: mapPost(postRow), 
        replies: (replies ?? []).map(mapPost), 
        parentPosts: parentRows.map(mapPost) 
      }; 
    }, 
    enabled: !!postId, 
    // ক্যাশ ক্লিয়ার করতে সাহায্য করবে
    staleTime: 0,
    gcTime: 0
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
        {data?.parentPosts.map(p => <PostCard key={p.id} post={p} />)} 
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
      {user ? <BottomNav /> : <GuestBottomNav />} 
    </div> 
  ); 
}
