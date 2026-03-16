import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import PostCard from '@/components/PostCard';
import BottomNav from '@/components/BottomNav';
import { useStore } from '@/lib/store';
import { CURRENT_USER_ID } from '@/lib/mockData';

export default function Profile() {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const { users, posts, toggleFollow } = useStore();
  const user = users.find(u => u.handle === handle);
  const currentUser = users.find(u => u.id === CURRENT_USER_ID);
  const isOwn = user?.id === CURRENT_USER_ID;
  const isFollowing = currentUser?.following.includes(user?.id ?? '') ?? false;
  const userPosts = posts.filter(p => p.userId === user?.id);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
        User not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </motion.button>
          <span className="text-sm font-bold">@{user.handle}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        <div className="border border-border rounded-md p-5 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-handle">@{user.handle}</h2>
              <p className="text-xs text-muted-foreground mt-1">{user.bio}</p>
            </div>
            {!isOwn && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleFollow(user.id)}
                className={`text-xs font-semibold uppercase tracking-label px-4 py-1.5 rounded-md border transition-colors ${
                  isFollowing
                    ? 'bg-muted text-muted-foreground border-border'
                    : 'bg-fab text-fab-foreground border-transparent'
                }`}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </motion.button>
            )}
          </div>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span><strong className="text-foreground">{user.followers.length}</strong> followers</span>
            <span><strong className="text-foreground">{user.following.length}</strong> following</span>
          </div>
        </div>

        <div className="space-y-4">
          {userPosts.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No signals yet.</p>
          ) : (
            userPosts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
