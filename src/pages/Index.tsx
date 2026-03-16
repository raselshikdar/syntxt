import { useState } from 'react';
import Header from '@/components/Header';
import FeedSwitcher from '@/components/FeedSwitcher';
import PostCard from '@/components/PostCard';
import ComposeFAB from '@/components/ComposeFAB';
import ComposeModal from '@/components/ComposeModal';
import BottomNav from '@/components/BottomNav';
import { usePosts } from '@/hooks/usePosts';
import { useFollowingIds } from '@/hooks/useFollow';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const [mode, setMode] = useState<'explore' | 'following'>('explore');
  const [composeOpen, setComposeOpen] = useState(false);
  const { data: posts = [], isLoading } = usePosts();
  const { data: followingIds = [] } = useFollowingIds();
  const { user } = useAuth();

  const filteredPosts = mode === 'explore'
    ? posts.filter(p => !p.repost_of || p.original_content)
    : posts.filter(p => (followingIds.includes(p.user_id) || p.user_id === user?.id) && (!p.repost_of || p.original_content));

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        <FeedSwitcher mode={mode} onChange={setMode} />
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Loading...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            The void is silent. {mode === 'following' ? 'Follow someone to see posts.' : 'Be the first to signal.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>
        )}
      </div>
      <ComposeFAB onClick={() => setComposeOpen(true)} />
      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} />
      <BottomNav />
    </div>
  );
}
