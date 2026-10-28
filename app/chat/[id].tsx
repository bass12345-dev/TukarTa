import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { ChevronLeft, Send, AlertCircle, Paperclip, MoreVertical, X, FileText } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme';
import { useAuth } from '@/context/auth';
import { supabase } from '../../utils/supabase';
import {
  ChatAttachment,
  ChatMessage,
  attachmentUrl,
  useConversations,
  useDeleteMessage,
  useEditMessage,
  useHideConversation,
  useMessages,
  useSendMessage,
  useToggleReaction,
} from '../../utils/hooks/useMessaging';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const EDIT_WINDOW_MS = 1000 * 60 * 60 * 24; // senders may edit for a day

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = String(id);
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList>(null);

  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [selected, setSelected] = useState<ChatMessage | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  const { data: messages, isLoading, error } = useMessages(conversationId);
  const { data: conversations } = useConversations();
  const sendMessage = useSendMessage();
  const editMessage = useEditMessage(conversationId);
  const deleteMessage = useDeleteMessage(conversationId);
  const toggleReaction = useToggleReaction(conversationId);
  const hideConversation = useHideConversation();
  const other = conversations?.find((c) => c.id === conversationId)?.other;

  const byId = useMemo(() => new Map((messages || []).map((m) => [m.id, m])), [messages]);

  // Live updates: new messages, edits, deletes and reactions in this conversation.
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        () => queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, () =>
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  const canEdit = (m: ChatMessage) =>
    m.sender_id === user?.id &&
    !m.deleted_at &&
    !m.attachment_path &&
    Date.now() - new Date(m.created_at).getTime() < EDIT_WINDOW_MS;

  const startReply = (m: ChatMessage) => {
    setEditing(null);
    setReplyTo(m);
  };

  const startEdit = (m: ChatMessage) => {
    setReplyTo(null);
    setAttachment(null);
    setEditing(m);
    setText(m.body);
  };

  const cancelComposer = () => {
    setReplyTo(null);
    setEditing(null);
    setAttachment(null);
    setText('');
  };

  const onSend = () => {
    const body = text.trim();
    if (editing) {
      if (!body) return;
      const id = editing.id;
      setEditing(null);
      setText('');
      editMessage.mutate({ messageId: id, body });
      return;
    }
    if (!body && !attachment) return;
    const pending = { body, replyTo: replyTo?.id ?? null, attachment };
    setText('');
    setReplyTo(null);
    setAttachment(null);
    sendMessage.mutate(
      { conversationId, body: pending.body, replyTo: pending.replyTo, attachment: pending.attachment },
      {
        // Keep the draft if the send fails.
        onError: () => {
          setText(pending.body);
          setReplyTo(replyTo);
          setAttachment(pending.attachment);
          Alert.alert('Not sent', 'Check your connection and try again.');
        },
      }
    );
  };

  const pickPhoto = async () => {
    setAttachOpen(false);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const a = result.assets[0];
    setAttachment({
      uri: a.uri,
      name: a.fileName || `photo-${Date.now()}.jpg`,
      mimeType: a.mimeType || 'image/jpeg',
      size: a.fileSize ?? null,
    });
  };

  const pickFile = async () => {
    setAttachOpen(false);
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets[0]) return;
    const a = result.assets[0];
    setAttachment({ uri: a.uri, name: a.name, mimeType: a.mimeType || 'application/octet-stream', size: a.size ?? null });
  };

  const confirmDelete = (m: ChatMessage) => {
    setSelected(null);
    Alert.alert('Delete message?', 'It will show as deleted for both of you.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMessage.mutate(m.id) },
    ]);
  };

  const confirmDeleteChat = () => {
    setMenuOpen(false);
    Alert.alert('Delete chat?', 'The chat is removed from your list. It comes back if they send a new message.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          hideConversation.mutate(conversationId, {
            onSuccess: () => router.back(),
            onError: () => Alert.alert('Could not delete the chat.'),
          }),
      },
    ]);
  };

  const react = (m: ChatMessage, emoji: string) => {
    setSelected(null);
    const reacted = m.message_reactions.some((r) => r.emoji === emoji && r.user_id === user?.id);
    toggleReaction.mutate({ messageId: m.id, emoji, reacted });
  };

  const copy = async (m: ChatMessage) => {
    setSelected(null);
    await Clipboard.setStringAsync(m.body);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior="padding"
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {other?.display_name || 'Conversation'}
        </Text>
        <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.iconBtn} accessibilityLabel="Chat options">
          <MoreVertical size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {isLoading && <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />}

      {error && (
        <View style={styles.center}>
          <AlertCircle size={36} color="#EF4444" />
          <Text style={[styles.hint, { color: colors.textDim }]}>Could not load messages.</Text>
        </View>
      )}

      {!isLoading && !error && (
        <FlatList
          ref={listRef}
          data={messages || []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <Text style={[styles.hint, { color: colors.textDim, textAlign: 'center', marginTop: 40 }]}>
              Say hi to {other?.display_name || 'them'}.
            </Text>
          }
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              mine={item.sender_id === user?.id}
              quoted={item.reply_to ? byId.get(item.reply_to) : undefined}
              myId={user?.id}
              onLongPress={() => setSelected(item)}
              onReact={(emoji) => react(item, emoji)}
            />
          )}
        />
      )}

      <View style={[styles.composer, { borderTopColor: colors.border, backgroundColor: colors.bg, paddingBottom: Math.max(insets.bottom, 12) }]}>
        {(replyTo || editing) && (
          <View style={[styles.modeBar, { backgroundColor: colors.bgCard, borderLeftColor: colors.primary }]}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.modeTitle, { color: colors.primary }]}>
                {editing ? 'Editing message' : `Replying to ${replyTo?.sender_id === user?.id ? 'yourself' : other?.display_name || 'them'}`}
              </Text>
              <Text style={[styles.modePreview, { color: colors.textDim }]} numberOfLines={1}>
                {(editing || replyTo)?.deleted_at ? 'Message deleted' : (editing || replyTo)?.body || 'Attachment'}
              </Text>
            </View>
            <TouchableOpacity onPress={cancelComposer} style={styles.iconBtn} accessibilityLabel="Cancel">
              <X size={18} color={colors.textDim} />
            </TouchableOpacity>
          </View>
        )}

        {attachment && (
          <View style={[styles.modeBar, { backgroundColor: colors.bgCard }]}>
            <FileText size={18} color={colors.primary} />
            <Text style={[styles.modePreview, { color: colors.text, flex: 1 }]} numberOfLines={1}>{attachment.name}</Text>
            <TouchableOpacity onPress={() => setAttachment(null)} style={styles.iconBtn} accessibilityLabel="Remove attachment">
              <X size={18} color={colors.textDim} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.composerRow}>
          <TouchableOpacity
            onPress={() => setAttachOpen(true)}
            disabled={!!editing}
            style={[styles.roundBtn, { borderColor: colors.border, opacity: editing ? 0.4 : 1 }]}
            accessibilityLabel="Attach"
          >
            <Paperclip size={18} color={colors.text} />
          </TouchableOpacity>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message"
            placeholderTextColor={colors.inputPlaceholder}
            style={[styles.input, { color: colors.inputText, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            onPress={onSend}
            disabled={(!text.trim() && !attachment) || sendMessage.isPending}
            style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: text.trim() || attachment ? 1 : 0.4 }]}
            accessibilityLabel={editing ? 'Save edit' : 'Send'}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Message actions */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setSelected(null)}>
          {selected && (
            <View style={[styles.sheet, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.reactRow}>
                {QUICK_REACTIONS.map((emoji) => (
                  <TouchableOpacity key={emoji} onPress={() => react(selected, emoji)} style={styles.reactBtn} accessibilityLabel={`React ${emoji}`}>
                    <Text style={{ fontSize: 22 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!selected.deleted_at && (
                <SheetAction label="Reply" onPress={() => { startReply(selected); setSelected(null); }} color={colors.text} />
              )}
              {canEdit(selected) && (
                <SheetAction label="Edit message" onPress={() => { startEdit(selected); setSelected(null); }} color={colors.text} />
              )}
              {!selected.deleted_at && selected.body ? (
                <SheetAction label="Copy" onPress={() => copy(selected)} color={colors.text} />
              ) : null}
              {selected.sender_id === user?.id && !selected.deleted_at && (
                <SheetAction label="Delete message" onPress={() => confirmDelete(selected)} color="#F87171" />
              )}
            </View>
          )}
        </TouchableOpacity>
      </Modal>

      {/* Attach menu */}
      <Modal visible={attachOpen} transparent animationType="fade" onRequestClose={() => setAttachOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setAttachOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <SheetAction label="Photo" onPress={pickPhoto} color={colors.text} />
            <SheetAction label="File" onPress={pickFile} color={colors.text} />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Chat options */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <SheetAction label="Delete chat" onPress={confirmDeleteChat} color="#F87171" />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function SheetAction({ label, onPress, color }: { label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.sheetAction} accessibilityRole="button">
      <Text style={[styles.sheetActionText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function MessageBubble({
  message,
  mine,
  quoted,
  myId,
  onLongPress,
  onReact,
}: {
  message: ChatMessage;
  mine: boolean;
  quoted?: ChatMessage;
  myId?: string;
  onLongPress: () => void;
  onReact: (emoji: string) => void;
}) {
  const { colors } = useAppTheme();
  const reactions = useMemo(() => {
    const counts = new Map<string, { count: number; mine: boolean }>();
    for (const r of message.message_reactions) {
      const entry = counts.get(r.emoji) || { count: 0, mine: false };
      entry.count += 1;
      if (r.user_id === myId) entry.mine = true;
      counts.set(r.emoji, entry);
    }
    return [...counts.entries()];
  }, [message.message_reactions, myId]);

  const deleted = !!message.deleted_at;

  return (
    <View style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={onLongPress}
        delayLongPress={300}
        style={[styles.bubble, { backgroundColor: mine ? colors.primary : colors.bgCard, borderColor: colors.border }]}
      >
        {quoted && (
          <View style={styles.quote}>
            <Text style={[styles.quoteText, { color: mine ? '#04140D' : colors.textDim }]} numberOfLines={1}>
              {quoted.deleted_at ? 'Message deleted' : quoted.body || quoted.attachment_name || 'Attachment'}
            </Text>
          </View>
        )}

        {!deleted && message.attachment_path && (
          <AttachmentView message={message} mine={mine} />
        )}

        {deleted ? (
          <Text style={[styles.deletedText, { color: mine ? '#04140D' : colors.textDim }]}>Message deleted</Text>
        ) : (
          !!message.body && (
            <Text style={{ color: mine ? '#04140D' : colors.text, fontSize: 15 }}>{message.body}</Text>
          )
        )}

        <View style={styles.metaRow}>
          {message.edited_at && !deleted && (
            <Text style={[styles.meta, { color: mine ? 'rgba(4,20,13,0.7)' : colors.textDim }]}>edited</Text>
          )}
          <Text style={[styles.meta, { color: mine ? 'rgba(4,20,13,0.7)' : colors.textDim }]}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </TouchableOpacity>

      {reactions.length > 0 && !deleted && (
        <View style={[styles.reactionRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
          {reactions.map(([emoji, info]) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => onReact(emoji)}
              style={[styles.reactionChip, { borderColor: info.mine ? colors.primary : colors.border, backgroundColor: colors.bgCard }]}
              accessibilityLabel={`${emoji} ${info.count}`}
            >
              <Text style={{ fontSize: 13 }}>{emoji} {info.count > 1 ? info.count : ''}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function AttachmentView({ message, mine }: { message: ChatMessage; mine: boolean }) {
  const { colors } = useAppTheme();
  const [url, setUrl] = useState<string | null>(null);
  const isImage = message.attachment_type?.startsWith('image/');

  useEffect(() => {
    let cancelled = false;
    if (message.attachment_path) {
      attachmentUrl(message.attachment_path)
        .then((u) => !cancelled && setUrl(u))
        .catch(() => !cancelled && setUrl(null));
    }
    return () => {
      cancelled = true;
    };
  }, [message.attachment_path]);

  if (isImage) {
    return url ? (
      <Image source={{ uri: url }} style={styles.image} accessibilityLabel={message.attachment_name || 'Photo'} />
    ) : (
      <View style={[styles.image, styles.center]}>
        <ActivityIndicator color={mine ? '#04140D' : colors.primary} />
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => url && Linking.openURL(url)}
      disabled={!url}
      style={[styles.fileChip, { backgroundColor: mine ? 'rgba(4,20,13,0.12)' : colors.bg }]}
      accessibilityLabel={`Open ${message.attachment_name || 'file'}`}
    >
      <FileText size={18} color={mine ? '#04140D' : colors.primary} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: mine ? '#04140D' : colors.text, fontWeight: '700' }} numberOfLines={1}>
          {message.attachment_name || 'File'}
        </Text>
        {!!message.attachment_size && (
          <Text style={{ color: mine ? 'rgba(4,20,13,0.7)' : colors.textDim, fontSize: 11 }}>
            {Math.max(1, Math.round(message.attachment_size / 1024))} KB
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', flex: 1 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  bubbleRow: { flexDirection: 'column', gap: 4 },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 6,
  },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    paddingLeft: 8,
    paddingVertical: 2,
    opacity: 0.85,
  },
  quoteText: { fontSize: 12 },
  deletedText: { fontSize: 14, fontStyle: 'italic' },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  meta: { fontSize: 11 },
  reactionRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 4 },
  reactionChip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  image: { width: 220, height: 180, borderRadius: 12 },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    minWidth: 180,
  },
  composer: { borderTopWidth: 1, padding: 10, gap: 8 },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  modeTitle: { fontSize: 11, fontWeight: '700' },
  modePreview: { fontSize: 13 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 120,
    fontSize: 15,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  hint: { fontSize: 14 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', padding: 16 },
  sheet: { borderRadius: 18, borderWidth: 1, padding: 10, gap: 4 },
  reactRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6 },
  reactBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sheetAction: { height: 48, justifyContent: 'center', paddingHorizontal: 12 },
  sheetActionText: { fontSize: 15, fontWeight: '600' },
});
