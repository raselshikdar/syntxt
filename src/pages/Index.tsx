import { useState } from 'react';
import Header from '@/components/Header';
import FeedSwitcher from '@/components/FeedSwitcher';
import PostCard from '@/components/PostCard';
import ComposeFAB from '@/components/ComposeFAB';
import ComposeModal from '@/components/ComposeModal';
import BottomNav from '@/components/BottomNav';
import { useStore } from '@/lib/store';
import { CURRENT_USER_ID } from '@/lib/mockData';

export default function Index() {
  const [mode, setMode] = useState<'explore' | 'following'>('explore');
  const [composeOpen, setComposeOpen] = useState(false);
  const posts = useStore(s => s.posts);
  const users = useStore(s => s.users);
  const currentUser = users.find(u => u.id === CURRENT_USER_ID);

  const filteredPosts = mode === 'explore'
    ? posts
    : posts.filter(p => currentUser?.following.includes(p.userId) || p.userId === CURRENT_USER_ID);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        <FeedSwitcher mode={mode} onChange={setMode} />
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            The void is silent. Explore to follow.
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
