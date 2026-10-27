import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Send, AlertCircle } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme';
import { useAuth } from '@/context/auth';
import { supabase } from '../../utils/supabase';
import { useConversations, useMessages, useSendMessage } from '../../utils/hooks/useMessaging';

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

  const { data: messages, isLoading, error } = useMessages(conversationId);
  const { data: conversations } = useConversations();
  const sendMessage = useSendMessage();
  const other = conversations?.find((c) => c.id === conversationId)?.other;

  // Live updates: refetch when a new message lands in this conversation.
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        () => queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  const onSend = () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    sendMessage.mutate(
      { conversationId, body },
      { onError: () => setText(body) } // keep the draft if the send fails
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior="padding"
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {other?.display_name || 'Conversation'}
        </Text>
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
          renderItem={({ item }) => {
            const mine = item.sender_id === user?.id;
            return (
              <View style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
                <View
                  style={[
                    styles.bubble,
                    {
                      backgroundColor: mine ? colors.primary : colors.bgCard,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: mine ? '#FFFFFF' : colors.text, fontSize: 15 }}>{item.body}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={[styles.composer, { borderTopColor: colors.border, backgroundColor: colors.bg, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message"
          placeholderTextColor={colors.inputPlaceholder}
          style={[
            styles.input,
            { color: colors.inputText, backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
          ]}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          onPress={onSend}
          disabled={!text.trim() || sendMessage.isPending}
          style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: text.trim() ? 1 : 0.4 }]}
        >
          <Send size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '800', flex: 1 },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  bubbleRow: { flexDirection: 'row' },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 120,
    fontSize: 15,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  hint: { fontSize: 14 },
});
