import { motion } from 'framer-motion';
import { Heart, MessageSquare, Repeat, Bookmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { usePostActions } from '@/hooks/usePostActions';
import type { PostWithProfile } from '@/hooks/usePosts';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ActionBtn({ icon, count, active, onClick }: { icon: React.ReactNode; count?: number; active?: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex items-center gap-1.5 text-xs transition-colors hover:bg-action-hover rounded-sm px-2 py-1 ${active ? 'text-handle font-semibold' : 'text-muted-foreground'}`}
    >
      {icon}
      {count !== undefined && count > 0 && <span>{count}</span>}
    </motion.button>
  );
}

export default function PostCard({ post, index = 0 }: { post: PostWithProfile; index?: number }) {
  const navigate = useNavigate();
  const { toggleLike, toggleSave, repost } = usePostActions();
  const isRepost = !!post.repost_of;
  const displayContent = isRepost ? (post.original_content ?? '') : post.content;
  const displayHandle = isRepost ? (post.original_handle ?? post.handle) : post.handle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={{ y: -2 }}
      className="border border-border p-5 bg-card rounded-md space-y-3 shadow-brutalist"
    >
      {isRepost && (
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-label text-muted-foreground mb-1">
          <Repeat size={10} /> <span>@{post.handle} reposted</span>
        </div>
      )}
      <div className="flex justify-between items-baseline">
        <span
          onClick={() => navigate(`/u/${displayHandle}`)}
          className="font-bold text-sm text-handle hover:underline cursor-pointer"
        >
          @{displayHandle}
        </span>
        <span className="text-[10px] uppercase tracking-label text-timestamp">
          {timeAgo(post.created_at)}
        </span>
      </div>
      <div className="prose prose-sm prose-slate dark:prose-invert max-w-none font-mono text-sm leading-relaxed text-card-foreground">
        <ReactMarkdown>{displayContent}</ReactMarkdown>
      </div>
      <div className="flex justify-between pt-2 border-t border-border/50">
        <ActionBtn icon={<Heart size={14} fill={post.liked_by_me ? 'currentColor' : 'none'} />} count={post.like_count} active={post.liked_by_me} onClick={() => toggleLike(post.id)} />
        <ActionBtn icon={<MessageSquare size={14} />} onClick={() => {}} />
        <ActionBtn icon={<Repeat size={14} />} count={post.repost_count} active={post.reposted_by_me} onClick={() => repost(post.id)} />
        <ActionBtn icon={<Bookmark size={14} fill={post.saved_by_me ? 'currentColor' : 'none'} />} active={post.saved_by_me} onClick={() => toggleSave(post.id)} />
      </div>
    </motion.div>
  );
}
