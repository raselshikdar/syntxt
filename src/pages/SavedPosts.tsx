import Header from '@/components/Header';
import PostCard from '@/components/PostCard';
import BottomNav from '@/components/BottomNav';
import { SkeletonPostList } from '@/components/SkeletonPost';
import { useSavedPosts } from '@/hooks/usePosts';

export default function SavedPosts() {
  const { data: saved = [], isLoading } = useSavedPosts();

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        <h2 className="text-xs uppercase tracking-label text-muted-foreground font-semibold">Saved Signals</h2>
        {isLoading ? (
          <p className="text-center text-muted-foreground text-sm py-16">Loading...</p>
        ) : saved.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-16">Nothing saved yet.</p>
        ) : (
          saved.map((post, i) => <PostCard key={post.id} post={post} index={i} />)
        )}
      </div>
      <BottomNav />
    </div>
  );
}
