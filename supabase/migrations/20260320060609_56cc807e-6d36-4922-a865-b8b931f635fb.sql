-- Allow users to delete messages in their conversations
CREATE POLICY "Users can delete messages in their conversations"
ON public.messages
FOR DELETE
TO authenticated
USING (
  conversation_id IN (
    SELECT conversation_id FROM conversation_participants
    WHERE user_id = auth.uid()
  )
);

-- Allow conversations to be updated (for updated_at)
CREATE POLICY "Users can update their conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT conversation_id FROM conversation_participants
    WHERE user_id = auth.uid()
  )
);