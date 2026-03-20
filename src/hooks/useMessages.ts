import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Conversation {
  id: string;
  updated_at: string;
  other_user: {
    user_id: string;
    handle: string;
    avatar_url: string | null;
    full_name: string | null;
  };
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export function useConversations() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async (): Promise<Conversation[]> => {
      if (!user) return [];

      // Get user's conversation IDs
      const { data: participations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (!participations?.length) return [];

      const convIds = participations.map(p => p.conversation_id);

      // Get conversations
      const { data: convs } = await supabase
        .from('conversations')
        .select('id, updated_at')
        .in('id', convIds)
        .order('updated_at', { ascending: false });

      if (!convs?.length) return [];

      // Get all participants for these conversations
      const { data: allParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', convIds);

      // Get other user IDs
      const otherUserIds = [...new Set(
        allParticipants?.filter(p => p.user_id !== user.id).map(p => p.user_id) ?? []
      )];

      const { data: profiles } = otherUserIds.length > 0
        ? await supabase.from('profiles').select('user_id, handle, avatar_url, full_name').in('user_id', otherUserIds)
        : { data: [] };

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

      // Get last message per conversation
      const { data: messages } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at, read, sender_id')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false });

      const lastMsgMap = new Map<string, { content: string; created_at: string }>();
      const unreadMap = new Map<string, number>();

      messages?.forEach(m => {
        if (!lastMsgMap.has(m.conversation_id)) {
          lastMsgMap.set(m.conversation_id, { content: m.content, created_at: m.created_at });
        }
        if (!m.read && m.sender_id !== user.id) {
          unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) ?? 0) + 1);
        }
      });

      // Build participant map
      const convOtherUser = new Map<string, string>();
      allParticipants?.forEach(p => {
        if (p.user_id !== user.id) convOtherUser.set(p.conversation_id, p.user_id);
      });

      return convs.map(c => {
        const otherUserId = convOtherUser.get(c.id);
        const profile = otherUserId ? profileMap.get(otherUserId) : null;
        const lastMsg = lastMsgMap.get(c.id);
        return {
          id: c.id,
          updated_at: c.updated_at,
          other_user: {
            user_id: otherUserId ?? '',
            handle: profile?.handle ?? 'unknown',
            avatar_url: profile?.avatar_url ?? null,
            full_name: profile?.full_name ?? null,
          },
          last_message: lastMsg?.content ?? null,
          last_message_at: lastMsg?.created_at ?? null,
          unread_count: unreadMap.get(c.id) ?? 0,
        };
      });
    },
    enabled: !!user,
    staleTime: 10000,
  });

  // Realtime subscription for new messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('conversations-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        qc.invalidateQueries({ queryKey: ['conversations'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return query;
}

export function useMessages(conversationId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async (): Promise<Message[]> => {
      if (!conversationId) return [];
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      return (data as Message[]) ?? [];
    },
    enabled: !!conversationId,
    staleTime: 5000,
  });

  // Realtime
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        qc.setQueryData<Message[]>(['messages', conversationId], old => {
          if (!old) return [payload.new as Message];
          if (old.some(m => m.id === (payload.new as Message).id)) return old;
          return [...old, payload.new as Message];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, qc]);

  return query;
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      });
      if (error) throw error;

      // Touch conversation updated_at
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if conversation already exists
      const { data: myConvs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (myConvs?.length) {
        const { data: otherConvs } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', otherUserId)
          .in('conversation_id', myConvs.map(c => c.conversation_id));

        if (otherConvs?.length) {
          return otherConvs[0].conversation_id;
        }
      }

      // Create new conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select('id')
        .single();

      if (convError || !conv) throw convError;

      // Add participants
      await supabase.from('conversation_participants').insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: otherUserId },
      ]);

      return conv.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkMessagesRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('read', false);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['unread-messages'] });
    },
  });
}

export function useUnreadMessagesCount() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [realtimeCount, setRealtimeCount] = useState<number | null>(null);

  const { data: fetchedCount = 0 } = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      // Get user's conversations
      const { data: parts } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (!parts?.length) return 0;

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', parts.map(p => p.conversation_id))
        .neq('sender_id', user.id)
        .eq('read', false);

      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('unread-messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id !== user.id) {
          setRealtimeCount(prev => (prev ?? fetchedCount) + 1);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        setRealtimeCount(null);
        qc.invalidateQueries({ queryKey: ['unread-messages'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchedCount, qc]);

  return { count: realtimeCount ?? fetchedCount };
}
