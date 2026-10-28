import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, getCurrentUser } from '../supabase';

export type NotificationSettings = {
  gigs: boolean;
  messages: boolean;
  setlists: boolean;
  reviews: boolean;
  offers: boolean;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  gigs: true,
  messages: true,
  setlists: true,
  reviews: false,
  offers: true,
};

export type AppNotification = {
  id: string;
  kind: 'invite' | 'message';
  title: string;
  body: string | null;
  data: Record<string, any>;
  read_at: string | null;
  created_at: string;
};

export type Conversation = {
  id: string;
  last_message_at: string;
  other: { id: string; display_name: string; avatar_url: string | null } | null;
  last_message: { body: string; sender_id: string; created_at: string; deleted_at: string | null; attachment_name: string | null } | null;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  reply_to: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
  message_reactions: { emoji: string; user_id: string }[];
};

export type ChatAttachment = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number | null;
};

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

// ── Notification settings (saved on the account) ─────────────────────────────

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      const user = await requireUser();
      const { data, error } = await supabase
        .from('users')
        .select('notification_settings')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...(data?.notification_settings || {}) } as NotificationSettings;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (next: NotificationSettings) => {
      const user = await requireUser();
      const { error } = await supabase
        .from('users')
        .update({ notification_settings: next })
        .eq('id', user.id);
      if (error) throw error;
    },
    // Flip the switch immediately; roll back if the save fails.
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ['notification-settings'] });
      const previous = queryClient.getQueryData<NotificationSettings>(['notification-settings']);
      queryClient.setQueryData(['notification-settings'], next);
      return { previous };
    },
    onError: (_err, _next, context) => {
      if (context?.previous) queryClient.setQueryData(['notification-settings'], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });
}

// ── In-app notifications inbox ───────────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const user = await requireUser();
      const { data, error } = await supabase
        .from('notifications')
        .select('id, kind, title, body, data, read_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as AppNotification[];
    },
    staleTime: 1000 * 30,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const user = await requireUser();
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ── Messaging (linked musicians only; the database enforces it) ──────────────

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const user = await requireUser();
      const { data, error } = await supabase
        .from('conversations')
        .select('id, user_a, user_b, last_message_at')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order('last_message_at', { ascending: false });
      if (error) throw error;

      const otherIds = (data || []).map((c) => (c.user_a === user.id ? c.user_b : c.user_a));
      const { data: people, error: peopleError } = otherIds.length
        ? await supabase.from('users').select('id, display_name, avatar_url').in('id', otherIds)
        : { data: [], error: null };
      if (peopleError) throw peopleError;

      // Newest message per conversation, for the preview line in the chat list.
      const ids = (data || []).map((c) => c.id);
      const lastByConversation = new Map<string, NonNullable<Conversation['last_message']>>();
      if (ids.length) {
        const { data: recent, error: recentError } = await supabase
          .from('messages')
          .select('conversation_id, body, sender_id, created_at, deleted_at, attachment_name')
          .in('conversation_id', ids)
          .order('created_at', { ascending: false })
          .limit(ids.length * 30);
        if (recentError) throw recentError;
        for (const m of recent || []) {
          if (!lastByConversation.has(m.conversation_id)) {
            lastByConversation.set(m.conversation_id, {
              body: m.body,
              sender_id: m.sender_id,
              created_at: m.created_at,
              deleted_at: m.deleted_at,
              attachment_name: m.attachment_name,
            });
          }
        }
      }

      const byId = new Map((people || []).map((p) => [p.id, p]));
      // Chats you deleted stay hidden until someone sends a newer message.
      const { data: hides } = await supabase
        .from('conversation_hides')
        .select('conversation_id, hidden_at')
        .eq('user_id', user.id);
      const hiddenAt = new Map((hides || []).map((h) => [h.conversation_id, h.hidden_at]));

      return (data || [])
        .filter((c) => {
          const hidden = hiddenAt.get(c.id);
          return !hidden || new Date(c.last_message_at) > new Date(hidden);
        })
        .map((c): Conversation => {
        const otherId = c.user_a === user.id ? c.user_b : c.user_a;
        return {
          id: c.id,
          last_message_at: c.last_message_at,
          other: byId.get(otherId) ?? null,
          last_message: lastByConversation.get(c.id) ?? null,
        };
      });
    },
    staleTime: 1000 * 30,
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const { data, error } = await supabase.rpc('start_conversation', { p_other: otherUserId });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [] as ChatMessage[];
      const { data, error } = await supabase
        .from('messages')
        .select(
          'id, conversation_id, sender_id, body, created_at, reply_to, edited_at, deleted_at, ' +
            'attachment_path, attachment_name, attachment_type, attachment_size, message_reactions(emoji, user_id)'
        )
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      // The embedded select string is built at runtime, so its shape is asserted here.
      return (data || []) as unknown as ChatMessage[];
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      body,
      replyTo,
      attachment,
    }: {
      conversationId: string;
      body: string;
      replyTo?: string | null;
      attachment?: ChatAttachment | null;
    }) => {
      const user = await requireUser();
      let attachmentPath: string | null = null;

      if (attachment) {
        // Files are stored under <conversation id>/ so only that conversation's members can read them.
        const safeName = attachment.name.replace(/[^A-Za-z0-9._-]/g, '_');
        attachmentPath = `${conversationId}/${Date.now()}-${safeName}`;
        const bytes = await fetch(attachment.uri).then((r) => r.arrayBuffer());
        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(attachmentPath, bytes, { contentType: attachment.mimeType, upsert: false });
        if (uploadError) throw uploadError;
      }

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: body.trim(),
        reply_to: replyTo ?? null,
        attachment_path: attachmentPath,
        attachment_name: attachment?.name ?? null,
        attachment_type: attachment?.mimeType ?? null,
        attachment_size: attachment?.size ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** Edit your own message. The database only lets the sender update it. */
export function useEditMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, body }: { messageId: string; body: string }) => {
      const { error } = await supabase
        .from('messages')
        .update({ body: body.trim(), edited_at: new Date().toISOString() })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });
}

/** Delete your own message for everyone. The text is kept but hidden, so replies still have a context. */
export function useDeleteMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** Add or remove your reaction on a message. */
export function useToggleReaction(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, emoji, reacted }: { messageId: string; emoji: string; reacted: boolean }) => {
      const user = await requireUser();
      if (reacted) {
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .eq('emoji', emoji);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('message_reactions')
          .insert({ message_id: messageId, user_id: user.id, emoji });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });
}

/** Delete the chat for you only. It returns when someone sends a newer message. */
export function useHideConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase.rpc('hide_conversation', { p_conversation: conversationId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** A short-lived link to an attachment, for the people in the conversation. */
export async function attachmentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('chat-attachments').createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}
