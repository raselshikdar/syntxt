import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import PostCard from '@/components/PostCard';
import BottomNav from '@/components/BottomNav';
import GuestBottomNav from '@/components/GuestBottomNav';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserPosts, useSavedPosts } from '@/hooks/usePosts';
import { useFollowStatus, useFollowCounts, useToggleFollow } from '@/hooks/useFollow';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SkeletonProfile, SkeletonPostList } from '@/components/SkeletonPost';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Profile() {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile', handle],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('handle', handle!).maybeSingle();
      return data;
    },
    enabled: !!handle,
  });

  const isOwn = profile?.user_id === user?.id;
  const { data: isFollowing = false } = useFollowStatus(profile?.user_id);
  const { data: counts = { followers: 0, following: 0 } } = useFollowCounts(profile?.user_id);
  const { data: userPosts = [] } = useUserPosts(profile?.user_id);
  const { data: savedPosts = [] } = useSavedPosts();
  const toggleFollow = useToggleFollow();

  const avatarUrl = profile?.avatar_url
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`
    : null;

  const bannerUrl = (profile as any)?.banner_url
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/banners/${(profile as any).banner_url}`
    : null;

  const { isLoading: profileLoading } = useQuery({
    queryKey: ['profile', handle],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('handle', handle!).maybeSingle();
      return data;
    },
    enabled: !!handle,
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
            <ArrowLeft size={18} />
            <span className="text-sm font-bold">Loading...</span>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
          <SkeletonProfile />
          <SkeletonPostList count={3} />
        </div>
        {user ? <BottomNav /> : <GuestBottomNav />}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
        User not found.
      </div>
    );
  }

  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const fullName = (profile as any)?.full_name;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </motion.button>
          <span className="text-sm font-bold">@{profile.handle}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        <div className="border border-border rounded-md bg-card overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-muted to-accent">
            {bannerUrl && (
              <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
            )}
          </div>

          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-10">
              <Avatar className="h-20 w-20 border-4 border-card">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={profile.handle} />
                ) : null}
                <AvatarFallback className="text-xl font-bold bg-muted text-muted-foreground">
                  {profile.handle.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="mt-12">
                {!isOwn && user ? (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleFollow(profile.user_id)}
                    className={`text-xs font-semibold uppercase tracking-label px-5 py-2 rounded-md border transition-colors ${
                      isFollowing
                        ? 'bg-muted text-muted-foreground border-border'
                        : 'bg-fab text-fab-foreground border-transparent'
                    }`}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </motion.button>
                ) : isOwn ? (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate('/settings')}
                    className="text-xs font-semibold uppercase tracking-label px-5 py-2 rounded-md border border-border text-foreground hover:bg-accent transition-colors"
                  >
                    Edit Profile
                  </motion.button>
                ) : null}
              </div>
            </div>

            <div className="mt-4 space-y-1">
              {fullName && <h2 className="text-base font-bold">{fullName}</h2>}
              <p className="text-sm text-handle font-semibold">@{profile.handle}</p>
              {profile.bio && (
                <p className="text-sm text-card-foreground leading-relaxed pt-1">{profile.bio}</p>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <Calendar size={12} />
                <span>Joined {joinDate}</span>
              </div>
            </div>

            <div className="flex gap-5 mt-4 pt-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                <strong className="text-foreground font-bold">{counts.followers}</strong> followers
              </span>
              <span className="text-xs text-muted-foreground">
                <strong className="text-foreground font-bold">{counts.following}</strong> following
              </span>
              <span className="text-xs text-muted-foreground">
                <strong className="text-foreground font-bold">{userPosts.length}</strong> signals
              </span>
            </div>
          </div>
        </div>

        {isOwn ? (
          <Tabs defaultValue="signals" className="space-y-4">
            <TabsList className="w-full">
              <TabsTrigger value="signals" className="flex-1 text-xs uppercase tracking-label font-semibold">Signals</TabsTrigger>
              <TabsTrigger value="bookmarks" className="flex-1 text-xs uppercase tracking-label font-semibold">Bookmarks</TabsTrigger>
            </TabsList>
            <TabsContent value="signals">
              {userPosts.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No signals yet.</p>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
                </div>
              )}
            </TabsContent>
            <TabsContent value="bookmarks">
              {savedPosts.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No bookmarks yet.</p>
              ) : (
                <div className="space-y-4">
                  {savedPosts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-label text-muted-foreground font-semibold px-1">Signals</h3>
            {userPosts.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No signals yet.</p>
            ) : (
              userPosts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)
            )}
          </div>
        )}
      </div>
      {user ? <BottomNav /> : <GuestBottomNav />}
    </div>
  );
}
