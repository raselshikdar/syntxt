import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, Repeat, Bookmark, MoreHorizontal, Trash2, Copy, Share2, Flag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { usePostActions } from '@/hooks/usePostActions';
import { useAuth } from '@/hooks/useAuth';
import type { PostWithProfile } from '@/hooks/usePosts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

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

function ActionBtn({ icon, count, active, onClick, disabled }: { icon: React.ReactNode; count?: number; active?: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={(e) => { e.stopPropagation(); if (!disabled) onClick(); }}
      className={`flex items-center gap-1.5 text-xs transition-colors hover:bg-action-hover rounded-sm px-2 py-1 ${active ? 'text-handle font-semibold' : 'text-muted-foreground'} ${disabled ? 'opacity-50 cursor-default' : ''}`}
    >
      {icon}
      {count !== undefined && count > 0 && <span>{count}</span>}
    </motion.button>
  );
}

const MAX_CHARS = 300;

function CommentComposer({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [content, setContent] = useState('');
  const { addReply } = usePostActions();
  const remaining = MAX_CHARS - content.length;

  const publish = async () => {
    if (content.trim().length === 0) return;
    await addReply(postId, content.trim());
    setContent('');
    onClose();
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="pt-3 border-t border-border/50 space-y-2">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Write a reply..."
          className="w-full bg-transparent border border-border rounded-md p-3 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground min-h-[80px]"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) publish(); }}
        />
        <div className="flex justify-between items-center">
          <span className={`text-xs font-mono ${remaining <= 20 ? (remaining <= 0 ? 'text-counter-danger' : 'text-counter-warning') : 'text-muted-foreground'}`}>
            {content.length}/{MAX_CHARS}
          </span>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="text-xs text-muted-foreground px-3 py-1.5">
              Cancel
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={publish}
              disabled={content.trim().length === 0}
              className="bg-fab text-fab-foreground text-xs font-semibold uppercase tracking-label px-4 py-1.5 rounded-md disabled:opacity-40"
            >
              Reply
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function PostCard({ post, index = 0 }: { post: PostWithProfile; index?: number }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleLike, toggleSave, repost, deletePost } = usePostActions();
  const [showComposer, setShowComposer] = useState(false);
  const isRepost = !!post.repost_of;
  const displayContent = isRepost ? (post.original_content ?? '') : post.content;
  const displayHandle = isRepost ? (post.original_handle ?? post.handle) : post.handle;
  const isOwn = user?.id === post.user_id;
  const isGuest = !user;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent);
    toast.success('Copied to clipboard!');
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  const handleInteraction = (action: () => void) => {
    if (isGuest) {
      toast.info('Sign in to interact with posts.');
      return;
    }
    action();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={{ y: -2 }}
      className="border border-border p-5 bg-card rounded-md space-y-3 shadow-brutalist cursor-pointer"
      onClick={() => navigate(`/post/${post.id}`)}
    >
      {isRepost && (
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-label text-muted-foreground mb-1">
          <Repeat size={10} /> <span>@{post.handle} reposted</span>
        </div>
      )}
      <div className="flex justify-between items-baseline">
        <span
          onClick={(e) => { e.stopPropagation(); navigate(`/u/${displayHandle}`); }}
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
      <div className="flex justify-between items-center pt-2 border-t border-border/50">
        <ActionBtn icon={<Heart size={14} fill={post.liked_by_me ? 'currentColor' : 'none'} />} count={post.like_count} active={post.liked_by_me} onClick={() => handleInteraction(() => toggleLike(post.id))} disabled={isGuest} />
        <ActionBtn icon={<MessageSquare size={14} />} count={post.reply_count} onClick={() => handleInteraction(() => setShowComposer(!showComposer))} disabled={isGuest} />
        <ActionBtn icon={<Repeat size={14} />} count={post.repost_count} active={post.reposted_by_me} onClick={() => handleInteraction(() => repost(post.id))} disabled={isGuest} />
        <ActionBtn icon={<Bookmark size={14} fill={post.saved_by_me ? 'currentColor' : 'none'} />} active={post.saved_by_me} onClick={() => handleInteraction(() => toggleSave(post.id))} disabled={isGuest} />

        <Popover>
          <PopoverTrigger asChild>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center text-xs text-muted-foreground hover:bg-action-hover rounded-sm px-1.5 py-1"
            >
              <MoreHorizontal size={14} />
            </motion.button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="end" onClick={(e) => e.stopPropagation()}>
            {isOwn && (
              <button onClick={() => deletePost(post.id)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-destructive hover:bg-accent rounded-sm">
                <Trash2 size={13} /> Delete Post
              </button>
            )}
            <button onClick={handleCopy} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-accent rounded-sm">
              <Copy size={13} /> Copy Text
            </button>
            <button onClick={handleShare} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-accent rounded-sm">
              <Share2 size={13} /> Share Link
            </button>
            {!isOwn && !isGuest && (
              <button onClick={() => toast.info('Report submitted.')} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-destructive hover:bg-accent rounded-sm">
                <Flag size={13} /> Report
              </button>
            )}
          </PopoverContent>
        </Popover>
      </div>
      <AnimatePresence>
        {showComposer && !isGuest && <CommentComposer postId={post.id} onClose={() => setShowComposer(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
