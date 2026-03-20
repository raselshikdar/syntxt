import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, PenLine, Search, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, useMessages, useSendMessage, useCreateConversation, useMarkMessagesRead } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-md mx-4 bg-card border border-border rounded-md shadow-brutalist overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
          <motion.button whileTap={{ scale: 0.85 }} onClick={onClose}>
            <X size={18} />
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
        </div>
      </motion.div>
    </div>
  );
}

function ConversationView({ conversationId, otherUser, onBack }: {
  conversationId: string;
  otherUser: { handle: string; avatar_url: string | null; full_name: string | null; user_id: string };
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { data: messages = [], isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markRead.mutate(conversationId);
  }, [conversationId, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage.mutate({ conversationId, content: trimmed });
    setText('');
  };

  const avatarUrl = otherUser.avatar_url
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${otherUser.avatar_url}`
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-3.5rem)]">
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <motion.button whileTap={{ scale: 0.85 }} onClick={onBack}>
          <ArrowLeft size={18} />
        </motion.button>
        <Avatar className="h-8 w-8">
          {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
          <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
            {otherUser.handle.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          {otherUser.full_name && <p className="text-sm font-bold leading-tight">{otherUser.full_name}</p>}
          <p className="text-xs text-muted-foreground">@{otherUser.handle}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <Skeleton className="h-8 w-32 rounded-lg" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-xs py-8">No messages yet. Say hello!</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                  isMine
                    ? 'bg-fab text-fab-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}>
                  {msg.content}
                  <div className={`text-[9px] mt-0.5 ${isMine ? 'text-fab-foreground/60' : 'text-muted-foreground'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 border-t border-border px-4 py-3 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-muted rounded-md px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-2 text-fab disabled:opacity-30"
        >
          <Send size={18} />
        </motion.button>
      </div>
    </div>
  );
}

export default function Messages() {
  const { data: conversations = [], isLoading } = useConversations();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeOtherUser, setActiveOtherUser] = useState<any>(null);
  const [showNewMsg, setShowNewMsg] = useState(false);
  const createConv = useCreateConversation();

  const handleSelectUser = async (userId: string) => {
    setShowNewMsg(false);
    const convId = await createConv.mutateAsync(userId);
    // Fetch the other user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, handle, avatar_url, full_name')
      .eq('user_id', userId)
      .maybeSingle();
    setActiveOtherUser(profile);
    setActiveConvId(convId);
  };

  const openConversation = (conv: typeof conversations[0]) => {
    setActiveConvId(conv.id);
    setActiveOtherUser(conv.other_user);
  };

  if (activeConvId && activeOtherUser) {
    return (
      <div className="min-h-screen bg-background pb-14">
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-2xl mx-auto">
            <ConversationView
              conversationId={activeConvId}
              otherUser={activeOtherUser}
              onBack={() => { setActiveConvId(null); setActiveOtherUser(null); }}
            />
          </div>
        </header>
        <BottomNav />
      </div>
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
          <p className="text-center text-muted-foreground text-sm py-16">No conversations yet.</p>
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
                      <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
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
        <PenLine size={22} />
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
