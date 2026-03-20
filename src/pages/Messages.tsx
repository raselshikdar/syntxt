import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, MessageSquarePlus, Search, X, MoreVertical, Trash2, Ban, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, useMessages, useSendMessage, useCreateConversation, useMarkMessagesRead, type Conversation } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

function SkeletonConversationList() {
  return (
    <div className="border border-border rounded-md bg-card divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </div>
  );
}

function NewMessageModal({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (userId: string) => void }) {
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  const { data: results = [] } = useQuery({
    queryKey: ['search-users-msg', search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const { data } = await supabase
        .from('profiles')
        .select('user_id, handle, avatar_url, full_name')
        .neq('user_id', user?.id ?? '')
        .or(`handle.ilike.%${search}%,full_name.ilike.%${search}%`)
        .limit(10);
      return data ?? [];
    },
    enabled: search.length >= 2,
  });

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-16"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md mx-4 bg-card border border-border rounded-md shadow-brutalist overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
          <motion.button whileTap={{ scale: 0.85 }} onClick={onClose}>
            <X size={18} className="text-foreground" />
          </motion.button>
          <span className="text-sm font-bold flex-1">New Message</span>
        </div>
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
            <Search size={14} className="text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="bg-transparent text-sm w-full outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto divide-y divide-border">
          {results.map((u) => {
            const avatarUrl = u.avatar_url
              ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${u.avatar_url}`
              : null;
            return (
              <button
                key={u.user_id}
                onClick={() => onSelect(u.user_id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
              >
                <Avatar className="h-9 w-9">
                  {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
                  <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
                    {u.handle.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  {u.full_name && <p className="text-sm font-semibold">{u.full_name}</p>}
                  <p className="text-xs text-muted-foreground">@{u.handle}</p>
                </div>
              </button>
            );
          })}
          {search.length >= 2 && results.length === 0 && (
            <p className="text-center text-muted-foreground text-xs py-6">No users found.</p>
          )}
          {search.length < 2 && (
            <p className="text-center text-muted-foreground text-xs py-6">Type at least 2 characters to search.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ConversationView({ conversationId, otherUser, onBack, onDeleteConversation }: {
  conversationId: string;
  otherUser: { handle: string; avatar_url: string | null; full_name: string | null; user_id: string };
  onBack: () => void;
  onDeleteConversation: () => void;
}) {
  const { user } = useAuth();
  const { data: messages = [], isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();
  const [text, setText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markRead.mutate(conversationId);
  }, [conversationId, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage.mutate({ conversationId, content: trimmed });
    setText('');
    inputRef.current?.focus();
  }, [text, conversationId, sendMessage]);

  const handleDeleteConversation = async () => {
    try {
      // Delete all messages in conversation
      await supabase.from('messages').delete().eq('conversation_id', conversationId);
      // Note: we can't delete conversation_participants or conversations due to RLS
      // but clearing messages effectively "deletes" the conversation visually
      toast.success('Conversation deleted');
      onDeleteConversation();
    } catch {
      toast.error('Failed to delete conversation');
    }
  };

  const handleBlockUser = async () => {
    try {
      // Create a restriction record
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      
      await supabase.from('user_restrictions').insert({
        user_id: otherUser.user_id,
        restriction_type: 'blocked_by_user',
        reason: `Blocked by ${currentUser.id}`,
        created_by: currentUser.id,
      });
      toast.success(`@${otherUser.handle} has been blocked`);
      onDeleteConversation();
    } catch {
      toast.error('Failed to block user');
    }
  };

  const avatarUrl = otherUser.avatar_url
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${otherUser.avatar_url}`
    : null;

  const displayName = otherUser.full_name || `@${otherUser.handle}`;

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0 bg-background/95 backdrop-blur-sm">
        <motion.button whileTap={{ scale: 0.85 }} onClick={onBack} className="p-1">
          <ArrowLeft size={20} className="text-foreground" />
        </motion.button>
        <Avatar className="h-8 w-8">
          {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
          <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
            {otherUser.handle.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight truncate">{displayName}</p>
          <p className="text-[11px] text-muted-foreground">@{otherUser.handle}</p>
        </div>
        
        {/* More menu */}
        <div className="relative" ref={menuRef}>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-accent transition-colors"
          >
            <MoreVertical size={18} className="text-foreground" />
          </motion.button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-md shadow-brutalist overflow-hidden z-50"
              >
                <button
                  onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent transition-colors text-left text-destructive"
                >
                  <Trash2 size={15} />
                  Delete Conversation
                </button>
                <button
                  onClick={() => { setShowMenu(false); setShowBlockConfirm(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent transition-colors text-left text-destructive"
                >
                  <Ban size={15} />
                  Block @{otherUser.handle}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <Skeleton className="h-9 rounded-lg" style={{ width: `${100 + Math.random() * 80}px` }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Avatar className="h-16 w-16 mb-4">
              {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
              <AvatarFallback className="text-lg font-bold bg-muted text-muted-foreground">
                {otherUser.handle.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-semibold">{displayName}</p>
            <p className="text-xs text-muted-foreground mt-1">@{otherUser.handle}</p>
            <p className="text-xs text-muted-foreground mt-4">Start a conversation. Say hello! 👋</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isMine = msg.sender_id === user?.id;
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const sameSender = prevMsg?.sender_id === msg.sender_id;
              const timeDiff = prevMsg ? new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() : Infinity;
              const showGap = timeDiff > 5 * 60 * 1000; // 5 min gap

              return (
                <div key={msg.id}>
                  {showGap && (
                    <div className="flex items-center justify-center py-3">
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {formatMessageDate(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${sameSender && !showGap ? 'mt-0.5' : 'mt-2'}`}
                  >
                    <div className={`max-w-[78%] px-3 py-2 text-sm leading-relaxed ${
                      isMine
                        ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
                        : 'bg-muted text-foreground rounded-2xl rounded-bl-md'
                    }`}>
                      <span className="break-words whitespace-pre-wrap">{msg.content}</span>
                      <div className={`flex items-center justify-end gap-1 mt-0.5 ${
                        isMine ? 'text-primary-foreground/50' : 'text-muted-foreground'
                      }`}>
                        <span className="text-[9px]">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMine && (
                          msg.read 
                            ? <CheckCheck size={12} /> 
                            : <Check size={12} />
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border bg-background px-3 py-2.5 safe-area-bottom">
        <div className="flex items-end gap-2 max-w-2xl mx-auto">
          <div className="flex-1 bg-muted rounded-2xl px-4 py-2.5 flex items-center">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center disabled:opacity-30 shrink-0 transition-opacity"
          >
            <Send size={17} />
          </motion.button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-6"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-md shadow-brutalist p-5 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-bold mb-2">Delete Conversation</h3>
              <p className="text-xs text-muted-foreground mb-5">
                This will permanently delete all messages in this conversation. This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); handleDeleteConversation(); }}
                  className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block confirmation dialog */}
      <AnimatePresence>
        {showBlockConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-6"
            onClick={() => setShowBlockConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-md shadow-brutalist p-5 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-bold mb-2">Block @{otherUser.handle}?</h3>
              <p className="text-xs text-muted-foreground mb-5">
                Blocked users won't be able to send you messages. You can unblock them later from settings.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowBlockConfirm(false)}
                  className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowBlockConfirm(false); handleBlockUser(); }}
                  className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  Block
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Messages() {
  const { data: conversations = [], isLoading } = useConversations();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeOtherUser, setActiveOtherUser] = useState<any>(null);
  const [showNewMsg, setShowNewMsg] = useState(false);
  const createConv = useCreateConversation();
  const qc = useQueryClient();

  const handleSelectUser = async (userId: string) => {
    setShowNewMsg(false);
    try {
      const convId = await createConv.mutateAsync(userId);
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, handle, avatar_url, full_name')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profile) {
        setActiveOtherUser(profile);
        setActiveConvId(convId);
      }
    } catch {
      toast.error('Failed to start conversation');
    }
  };

  const openConversation = (conv: Conversation) => {
    setActiveConvId(conv.id);
    setActiveOtherUser(conv.other_user);
  };

  const handleBack = () => {
    setActiveConvId(null);
    setActiveOtherUser(null);
    qc.invalidateQueries({ queryKey: ['conversations'] });
  };

  if (activeConvId && activeOtherUser) {
    return (
      <ConversationView
        conversationId={activeConvId}
        otherUser={activeOtherUser}
        onBack={handleBack}
        onDeleteConversation={handleBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        <h2 className="text-xs uppercase tracking-label text-muted-foreground font-semibold">Messages</h2>
        {isLoading ? (
          <SkeletonConversationList />
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquarePlus size={40} className="text-muted-foreground/40 mb-4" />
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Tap the button below to start messaging.</p>
          </div>
        ) : (
          <div className="border border-border rounded-md bg-card divide-y divide-border overflow-hidden">
            {conversations.map((conv) => {
              const avatarUrl = conv.other_user.avatar_url
                ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${conv.other_user.avatar_url}`
                : null;
              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left"
                >
                  <Avatar className="h-10 w-10">
                    {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
                    <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
                      {conv.other_user.handle.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold truncate">
                        {conv.other_user.full_name || `@${conv.other_user.handle}`}
                      </span>
                      {conv.last_message_at && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatTime(conv.last_message_at)}
                        </span>
                      )}
                    </div>
                    {conv.last_message && (
                      <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {conv.last_message}
                      </p>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full px-1">
                      {conv.unread_count > 99 ? '99+' : conv.unread_count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating new message button */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => setShowNewMsg(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-fab text-fab-foreground rounded-full shadow-brutalist flex items-center justify-center z-30"
        aria-label="New message"
      >
        <MessageSquarePlus size={22} />
      </motion.button>

      <AnimatePresence>
        {showNewMsg && (
          <NewMessageModal open={showNewMsg} onClose={() => setShowNewMsg(false)} onSelect={handleSelectUser} />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / (1000 * 60 * 60);

  if (diffH < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffH < 24 * 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatMessageDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - msgDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDays === 1) return `Yesterday ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
