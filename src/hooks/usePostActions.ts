import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function usePostActions() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['posts'] });
    qc.invalidateQueries({ queryKey: ['saved-posts'] });
    qc.invalidateQueries({ queryKey: ['user-posts'] });
    qc.invalidateQueries({ queryKey: ['post-detail'] });
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const { data: existing } = await supabase.from('likes').select('id').eq('user_id', user.id).eq('post_id', postId).maybeSingle();
    if (existing) {
      await supabase.from('likes').delete().eq('id', existing.id);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
      const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
      if (post && post.user_id !== user.id) {
        await supabase.from('notifications').insert({ user_id: post.user_id, actor_id: user.id, type: 'like', post_id: postId });
      }
    }
    invalidate();
  };

  const toggleSave = async (postId: string) => {
    if (!user) return;
    const { data: existing } = await supabase.from('saves').select('id').eq('user_id', user.id).eq('post_id', postId).maybeSingle();
    if (existing) {
      await supabase.from('saves').delete().eq('id', existing.id);
    } else {
      await supabase.from('saves').insert({ user_id: user.id, post_id: postId });
    }
    invalidate();
  };

  const repost = async (postId: string) => {
    if (!user) return;
    await supabase.from('posts').insert({ user_id: user.id, content: '', repost_of: postId });
    const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
    if (post && post.user_id !== user.id) {
      await supabase.from('notifications').insert({ user_id: post.user_id, actor_id: user.id, type: 'repost', post_id: postId });
    }
    invalidate();
    toast.success('Reposted!');
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
    const { error } = await supabase.from('posts').insert({ user_id: user.id, content, reply_to: postId });
    if (error) { toast.error(error.message); return; }
    // Notify post author
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
