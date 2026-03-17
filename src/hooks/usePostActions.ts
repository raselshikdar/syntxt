import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PostWithProfile } from './usePosts';

export function usePostActions() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['posts'] });
    qc.invalidateQueries({ queryKey: ['saved-posts'] });
    qc.invalidateQueries({ queryKey: ['user-posts'] });
    qc.invalidateQueries({ queryKey: ['post-detail'] });
  };

  const optimisticUpdate = (postId: string, updater: (post: PostWithProfile) => PostWithProfile) => {
    const queryKeys = [['posts'], ['saved-posts'], ['user-posts'], ['post-detail']];
    queryKeys.forEach(key => {
      qc.setQueriesData<PostWithProfile[]>({ queryKey: key }, (old) => {
        if (!old) return old;
        return old.map(p => p.id === postId ? updater(p) : p);
      });
    });
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    // Optimistic: check current state from cache
    const posts = qc.getQueryData<PostWithProfile[]>(['posts', user.id]);
    const current = posts?.find(p => p.id === postId);
    const wasLiked = current?.liked_by_me ?? false;

    optimisticUpdate(postId, p => ({
      ...p,
      liked_by_me: !wasLiked,
      like_count: wasLiked ? p.like_count - 1 : p.like_count + 1,
    }));

    try {
      if (wasLiked) {
        const { data: existing } = await supabase.from('likes').select('id').eq('user_id', user.id).eq('post_id', postId).maybeSingle();
        if (existing) await supabase.from('likes').delete().eq('id', existing.id);
      } else {
        await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
        const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
        if (post && post.user_id !== user.id) {
          await supabase.from('notifications').insert({ user_id: post.user_id, actor_id: user.id, type: 'like', post_id: postId });
        }
      }
    } catch {
      // Revert on error
      optimisticUpdate(postId, p => ({
        ...p,
        liked_by_me: wasLiked,
        like_count: wasLiked ? p.like_count + 1 : p.like_count - 1,
      }));
    }
    invalidate();
  };

  const toggleSave = async (postId: string) => {
    if (!user) return;
    const posts = qc.getQueryData<PostWithProfile[]>(['posts', user.id]);
    const current = posts?.find(p => p.id === postId);
    const wasSaved = current?.saved_by_me ?? false;

    optimisticUpdate(postId, p => ({ ...p, saved_by_me: !wasSaved }));

    try {
      if (wasSaved) {
        const { data: existing } = await supabase.from('saves').select('id').eq('user_id', user.id).eq('post_id', postId).maybeSingle();
        if (existing) await supabase.from('saves').delete().eq('id', existing.id);
      } else {
        await supabase.from('saves').insert({ user_id: user.id, post_id: postId });
      }
    } catch {
      optimisticUpdate(postId, p => ({ ...p, saved_by_me: wasSaved }));
    }
    invalidate();
  };

  const repost = async (postId: string) => {
    if (!user) return;
    optimisticUpdate(postId, p => ({ ...p, reposted_by_me: true, repost_count: p.repost_count + 1 }));
    try {
      await supabase.from('posts').insert({ user_id: user.id, content: '', repost_of: postId });
      const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
      if (post && post.user_id !== user.id) {
        await supabase.from('notifications').insert({ user_id: post.user_id, actor_id: user.id, type: 'repost', post_id: postId });
      }
      toast.success('Reposted!');
    } catch {
      optimisticUpdate(postId, p => ({ ...p, reposted_by_me: false, repost_count: p.repost_count - 1 }));
    }
    invalidate();
  };

  const addPost = async (content: string) => {
    if (!user) return;
    const { error } = await supabase.from('posts').insert({ user_id: user.id, content });
    if (error) { toast.error(error.message); return; }
    invalidate();
    toast.success('Published!');
  };

  const addReply = async (postId: string, content: string) => {
    if (!user) return;
    // Optimistic reply count
    optimisticUpdate(postId, p => ({ ...p, reply_count: p.reply_count + 1 }));
    const { error } = await supabase.from('posts').insert({ user_id: user.id, content, reply_to: postId });
    if (error) {
      toast.error(error.message);
      optimisticUpdate(postId, p => ({ ...p, reply_count: p.reply_count - 1 }));
      return;
    }
    const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
    if (post && post.user_id !== user.id) {
      await supabase.from('notifications').insert({ user_id: post.user_id, actor_id: user.id, type: 'reply', post_id: postId });
    }
    invalidate();
    toast.success('Reply posted!');
  };

  const deletePost = async (postId: string) => {
    if (!user) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) { toast.error(error.message); return; }
    invalidate();
    toast.success('Post deleted.');
  };

  return { toggleLike, toggleSave, repost, addPost, addReply, deletePost };
}
