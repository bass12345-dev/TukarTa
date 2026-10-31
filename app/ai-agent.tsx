import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Calendar,
  ChevronLeft,
  Music,
  Send,
  UserPlus,
  X,
  History,
  Plus,
  Circle,
  CheckCircle,
  Check,
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  Loader2
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { readAsArrayBuffer } from '../utils/file';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useAppTheme } from '../context/theme';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import {
  AgentError,
  AiProposal,
  useAIChatHistory,
  useAISessions,
  useCreateAISession,
  useDecideProposals,
  useGigDetails,
  useSessionProposals,
  useSetlistAI,
} from '@/utils/hooks/useMusician';
import { supabase } from '../utils/supabase';
import { decode } from 'base64-arraybuffer';

// ─── Types ────────────────────────────────────────────────────────────────────
type Segment = { text: string; highlight?: boolean };
type Message = {
  id: string;
  role: 'assistant' | 'user';
  segments: Segment[];
  isAnimating?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rich(parts: (string | { h: string })[]): Segment[] {
  return parts.map((p) =>
    typeof p === 'string' ? { text: p } : { text: p.h, highlight: true }
  );
}

function TypewriterText({ segments, onComplete }: { segments: Segment[]; onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  
  useEffect(() => {
    if (index >= segments.length) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      if (charIndex < segments[index].text.length) {
        setCharIndex(prev => prev + 1);
      } else {
        setIndex(prev => prev + 1);
        setCharIndex(0);
      }
    }, 8); // Significantly faster typing speed

    return () => clearTimeout(timer);
  }, [index, charIndex, segments]);

  const displayedSegments = segments.slice(0, index + 1).map((seg, i) => ({
    ...seg,
    text: i === index ? seg.text.slice(0, charIndex) : seg.text
  }));

  return <RichText segments={displayedSegments} isUser={false} />;
}

/** Old transcripts embedded an `ACTIONS: [...]` blob; strip it (those were applied/handled in their own session). */
function parseAIMessage(content: string) {
  return { text: content.replace(/ACTIONS:\s*\[[\s\S]*\]\s*$/, '').trim() };
}

// ─── Proposal Card (human-in-the-loop) ───────────────────────────────────────────────────────
const KIND_LABEL: Record<AiProposal['kind'], string> = {
  create_gig: 'New gig',
  update_gig: 'Edit gig',
  add_songs_to_setlist: 'Add to setlist',
  remove_songs_from_setlist: 'Remove from setlist',
  reorder_setlist: 'Reorder setlist',
  add_to_dictionary: 'Add to repertoire',
  invite_musician: 'Invite musician',
  band_setlist: 'Band setlist',
};

const EDITABLE_KINDS: AiProposal['kind'][] = ['create_gig', 'update_gig', 'invite_musician', 'band_setlist'];

/** What a high-risk proposal does to other people, shown next to the kind label. */
const HIGH_RISK_NOTE: Partial<Record<AiProposal['kind'], string>> = {
  invite_musician: 'SENDS A MESSAGE',
  band_setlist: "UPDATES MEMBERS' LIBRARIES",
};

function ProposalCard({
  proposal,
  busy,
  onApprove,
  onReject,
  onEdit,
}: {
  proposal: AiProposal;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
}) {
  const { colors } = useAppTheme();
  const isPending = proposal.status === 'pending';
  const isHigh = proposal.risk === 'high';
  const Icon =
    proposal.kind === 'create_gig' || proposal.kind === 'update_gig'
      ? Calendar
      : proposal.kind === 'invite_musician'
      ? UserPlus
      : Music;

  const statusLabel: Record<string, string> = {
    executed: 'Done',
    rejected: 'Dismissed',
    failed: 'Failed',
    expired: 'Expired',
    executing: 'Applying…',
  };

  return (
    <View
      style={[
        styles.proposalCard,
        { backgroundColor: colors.bgCard, borderColor: isHigh && isPending ? '#F59E0B' : colors.border },
        proposal.status === 'executed' && { borderColor: colors.primary },
      ]}
    >
      <View style={styles.proposalContent}>
        <View style={[styles.proposalIconBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Icon size={18} color={isHigh ? '#F59E0B' : colors.primary} />
        </View>
        <View style={styles.proposalTextContainer}>
          <Text style={[styles.proposalKind, { color: isHigh ? '#F59E0B' : colors.primaryDark }]}>
            {KIND_LABEL[proposal.kind]?.toUpperCase()}
            {isHigh ? `  ·  ${HIGH_RISK_NOTE[proposal.kind] ?? 'NEEDS YOUR CONFIRMATION'}` : ''}
          </Text>
          <Text style={[styles.proposalTitle, { color: colors.text }]} numberOfLines={2}>
            {proposal.preview?.title}
          </Text>
          <Text style={[styles.proposalSubtitle, { color: colors.textDim }]} numberOfLines={2}>
            {proposal.preview?.subtitle}
          </Text>
        </View>
        {!isPending && (
          <View
            style={[
              styles.statusChip,
              {
                backgroundColor:
                  proposal.status === 'executed' ? colors.primaryLight : colors.bgSecondary,
                borderColor: proposal.status === 'failed' ? '#EF4444' : colors.border,
              },
            ]}
          >
            {proposal.status === 'executing' ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text
                style={[
                  styles.statusChipText,
                  { color: proposal.status === 'failed' ? '#EF4444' : colors.primaryDark },
                ]}
              >
                {statusLabel[proposal.status] || proposal.status}
              </Text>
            )}
          </View>
        )}
      </View>

      {proposal.preview?.lines?.length > 0 && (
        <View style={[styles.proposalLines, { borderTopColor: colors.border }]}>
          {proposal.preview.lines.map((line, i) => (
            <Text key={i} style={[styles.proposalLine, { color: colors.textSecondary }]} numberOfLines={2}>
              {line}
            </Text>
          ))}
        </View>
      )}

      {proposal.status === 'failed' && !!proposal.error && (
        <View style={[styles.proposalLines, { borderTopColor: colors.border, flexDirection: 'row', gap: 6 }]}>
          <AlertTriangle size={14} color="#EF4444" />
          <Text style={[styles.proposalLine, { color: '#EF4444', flex: 1 }]}>{proposal.error}</Text>
        </View>
      )}

      {isPending && (
        <View style={[styles.proposalActionsBar, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.proposalBtn, { borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
            onPress={onReject}
            disabled={busy}
          >
            <X size={14} color={colors.textDim} />
            <Text style={[styles.proposalBtnText, { color: colors.textDim }]}>
              {proposal.kind === 'band_setlist' ? 'Cancel' : 'Dismiss'}
            </Text>
          </TouchableOpacity>
          {EDITABLE_KINDS.includes(proposal.kind) && (
            <TouchableOpacity
              style={[styles.proposalBtn, { borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
              onPress={onEdit}
              disabled={busy}
            >
              <Text style={[styles.proposalBtnText, { color: colors.text }]}>Edit</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.proposalBtn, styles.proposalBtnPrimary, { backgroundColor: colors.primary }, busy && { opacity: 0.6 }]}
            onPress={onApprove}
            disabled={busy}
          >
            {busy ? <ActivityIndicator size="small" color="#FFF" /> : <Check size={14} color="#FFF" strokeWidth={3} />}
            <Text style={[styles.proposalBtnText, { color: '#FFF' }]}>
              {proposal.kind === 'band_setlist' ? 'Confirm' : isHigh ? 'Send' : 'Approve'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/**
 * Band setlist review: drop songs, rename, and choose which members get which missing songs added to
 * their library. It can only narrow the proposal; the server rejects anything it did not originally propose.
 */
function BandSetlistEditor({
  proposal,
  onClose,
  onSave,
}: {
  proposal: AiProposal;
  onClose: () => void;
  onSave: (edits: Record<string, any>) => void;
}) {
  const { colors } = useAppTheme();
  const payload = proposal.payload || {};
  const detail = proposal.preview?.detail;
  const songs = detail?.songs ?? [];
  const members = detail?.members ?? {};
  const pairKey = (member: string, song: string) => `${member}:${song}`;
  const proposedPairs = React.useMemo(
    () =>
      new Set<string>(
        (payload.library_adds || []).flatMap((a: any) => (a.song_ids || []).map((s: string) => pairKey(a.musician_id, s)))
      ),
    [proposal.id]
  );
  const [name, setName] = useState<string>(payload.name ?? 'Main Setlist');
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(() => new Set(payload.song_ids || []));
  const [pairs, setPairs] = useState<Set<string>>(() => new Set(proposedPairs));

  const toggle = <T,>(set: Set<T>, value: T) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    return next;
  };

  const keptSongIds: string[] = (payload.song_ids || []).filter((id: string) => selectedSongs.has(id));
  const libraryAdds = (payload.library_adds || [])
    .map((a: any) => ({
      musician_id: a.musician_id,
      song_ids: (a.song_ids || []).filter((s: string) => selectedSongs.has(s) && pairs.has(pairKey(a.musician_id, s))),
    }))
    .filter((a: any) => a.song_ids.length > 0);
  const addCount = libraryAdds.reduce((n: number, a: any) => n + a.song_ids.length, 0);

  const save = () => {
    const edits: Record<string, any> = { song_ids: keptSongIds, library_adds: libraryAdds };
    if (name.trim() && name.trim() !== payload.name) edits.name = name.trim();
    onSave(edits);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1, maxHeight: '85%' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Review band setlist</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Setlist name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            maxLength={60}
            style={[styles.editInput, { color: colors.inputText, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            placeholderTextColor={colors.inputPlaceholder}
          />

          <ScrollView style={{ marginTop: 12 }} contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
            {songs.map((s, i) => {
              const on = selectedSongs.has(s.song_id);
              return (
                <View key={s.song_id} style={[styles.setlistEditRow, { borderColor: colors.border, opacity: on ? 1 : 0.5 }]}>
                  <TouchableOpacity
                    style={styles.setlistEditSong}
                    onPress={() => setSelectedSongs((cur) => toggle(cur, s.song_id))}
                  >
                    {on ? <CheckCircle size={18} color={colors.primary} /> : <Circle size={18} color={colors.textDim} />}
                    <Text style={[styles.proposalLine, { color: colors.text, flex: 1 }]} numberOfLines={2}>
                      {i + 1}. {s.title} — {s.artist}
                    </Text>
                  </TouchableOpacity>
                  {s.missing_for.length > 0 && (
                    <View style={styles.setlistEditChips}>
                      <Text style={[styles.setlistEditHint, { color: colors.textDim }]}>Missing for:</Text>
                      {s.missing_for.map((m) => {
                        const key = pairKey(m, s.song_id);
                        const proposed = proposedPairs.has(key);
                        const adding = on && proposed && pairs.has(key);
                        return (
                          <TouchableOpacity
                            key={m}
                            disabled={!on || !proposed}
                            onPress={() => setPairs((cur) => toggle(cur, key))}
                            style={[
                              styles.setlistEditChip,
                              {
                                borderColor: adding ? colors.primary : colors.border,
                                backgroundColor: adding ? colors.primaryLight : colors.bgSecondary,
                              },
                            ]}
                          >
                            {adding && <Plus size={11} color={colors.primaryDark} />}
                            <Text style={[styles.setlistEditChipText, { color: adding ? colors.primaryDark : colors.textDim }]}>
                              {members[m] ?? 'Member'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <Text style={[styles.setlistEditHint, { color: colors.textSecondary, marginVertical: 8 }]}>
            {keptSongIds.length} song{keptSongIds.length === 1 ? '' : 's'} ·{' '}
            {addCount
              ? `adds ${addCount} song${addCount === 1 ? '' : 's'} to ${libraryAdds.length} member librar${libraryAdds.length === 1 ? 'y' : 'ies'}`
              : 'no library changes'}
            . Tap a name to stop adding the song to their library.
          </Text>
          <TouchableOpacity
            style={[styles.editSaveBtn, { backgroundColor: colors.primary }, !keptSongIds.length && { opacity: 0.5 }]}
            onPress={save}
            disabled={!keptSongIds.length}
          >
            <Check size={16} color="#FFF" strokeWidth={3} />
            <Text style={styles.editSaveText}>Save & confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/** Lets the user tweak the editable fields of a proposal before approving it. */
function EditProposalModal({
  proposal,
  onClose,
  onSave,
}: {
  proposal: AiProposal | null;
  onClose: () => void;
  onSave: (edits: Record<string, any>) => void;
}) {
  const { colors } = useAppTheme();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!proposal || proposal.kind === 'band_setlist') return;
    const p = proposal.payload || {};
    setValues({
      name: p.name ?? '',
      venue: p.venue ?? '',
      date: p.date ? String(p.date).slice(0, 10) : '',
      message: p.message ?? '',
    });
  }, [proposal?.id]);

  if (!proposal) return null;
  if (proposal.kind === 'band_setlist') {
    return <BandSetlistEditor proposal={proposal} onClose={onClose} onSave={onSave} />;
  }
  const fields: { key: string; label: string; multiline?: boolean; hint?: string }[] =
    proposal.kind === 'invite_musician'
      ? [{ key: 'message', label: 'Message to the musician', multiline: true }]
      : [
          { key: 'name', label: 'Gig name' },
          { key: 'venue', label: 'Venue' },
          { key: 'date', label: 'Date', hint: 'YYYY-MM-DD' },
        ];

  const save = () => {
    const edits: Record<string, any> = {};
    for (const f of fields) {
      const original = f.key === 'date' && proposal.payload?.date ? String(proposal.payload.date).slice(0, 10) : proposal.payload?.[f.key] ?? '';
      if ((values[f.key] ?? '') !== original && (values[f.key] ?? '').trim()) edits[f.key] = values[f.key].trim();
    }
    onSave(edits);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit before approving</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          {fields.map((f) => (
            <View key={f.key} style={{ marginBottom: 12 }}>
              <Text style={[styles.editLabel, { color: colors.textSecondary }]}>
                {f.label}
                {f.hint ? `  (${f.hint})` : ''}
              </Text>
              <TextInput
                value={values[f.key] ?? ''}
                onChangeText={(t) => setValues((v) => ({ ...v, [f.key]: t }))}
                multiline={f.multiline}
                maxLength={f.multiline ? 300 : 120}
                style={[
                  styles.editInput,
                  { color: colors.inputText, backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                  f.multiline && { minHeight: 90, textAlignVertical: 'top' },
                ]}
                placeholderTextColor={colors.inputPlaceholder}
              />
            </View>
          ))}
          <TouchableOpacity style={[styles.editSaveBtn, { backgroundColor: colors.primary }]} onPress={save}>
            <Check size={16} color="#FFF" strokeWidth={3} />
            <Text style={styles.editSaveText}>{proposal.risk === 'high' ? 'Save & send' : 'Save & approve'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Typing Indicator ────────────────────────────────────────────────────────
function TypingIndicator() {
  const { colors } = useAppTheme();
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length < 3 ? prev + '.' : ''));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.msgWrapper, styles.msgWrapperAI]}>
      <View style={[styles.msgBubble, styles.msgBubbleAI, { backgroundColor: colors.bgCard, borderColor: colors.border, paddingVertical: 12, paddingHorizontal: 16 }]}>
        <Text style={[styles.aiLabel, { color: colors.primary }]}>TUKARTA BOT IS TYPING</Text>
        <View style={styles.dotsRow}>
          <Text style={[styles.typingText, { color: colors.textDim }]}>Thinking{dots}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AIAgentScreen() {
  const router = useRouter();
  const { gigId } = useLocalSearchParams();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [lastSyncedSessionId, setLastSyncedSessionId] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const isCreatingSession = useRef(false);
  const autoCreatedSessionRef = useRef<string | null>(null);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors, isDark } = useAppTheme();

  // 1. Data Hooks
  const { data: gig } = useGigDetails(gigId as string);
  
  const { data: sessions, isLoading: isLoadingSessions } = useAISessions();
  const { data: historyMessages, isLoading: isLoadingHistory } = useAIChatHistory(sessionId || undefined);
  const createSession = useCreateAISession();
  const aiMutation = useSetlistAI();
  const decideMutation = useDecideProposals();
  const { data: proposals } = useSessionProposals(sessionId || undefined);
  const [editingProposal, setEditingProposal] = useState<AiProposal | null>(null);
  const [decidingIds, setDecidingIds] = useState<string[]>([]);

  const proposalsByMessage = React.useMemo(() => {
    const map: Record<string, AiProposal[]> = {};
    for (const pr of proposals || []) {
      if (!pr.message_id) continue;
      (map[pr.message_id] ||= []).push(pr);
    }
    return map;
  }, [proposals]);

  const decide = async (ids: string[], decision: 'approve' | 'reject', edits?: Record<string, any>) => {
    setDecidingIds((cur) => [...cur, ...ids]);
    try {
      const { results } = await decideMutation.mutateAsync({ proposalIds: ids, decision, edits });
      const failed = results.filter((r) => r.error && r.status !== 'executed' && r.status !== 'rejected');
      if (failed.length) {
        Alert.alert('Could not apply', failed[0].error || 'That change could not be applied. Ask the assistant to try again.');
      }
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message || 'Could not reach the assistant. Please try again.');
    } finally {
      setDecidingIds((cur) => cur.filter((id) => !ids.includes(id)));
    }
  };

  // 2. Sync history to local state
  useEffect(() => {
    if (historyMessages && !isLoadingHistory && !isCreatingSession.current) {
      const isInitialLoad = !lastSyncedSessionId && messages.length === 0;
      const isSessionSwitch = sessionId && sessionId !== lastSyncedSessionId;
      
      const isFirstLoadForSession = sessionId && sessionId === lastSyncedSessionId && messages.length === 0 && historyMessages.length > 0;

      if (isInitialLoad || isSessionSwitch || isFirstLoadForSession) {
        const mapped: Message[] = historyMessages.map((m: any) => {
          const { text } = parseAIMessage(m.content);
          return {
            id: m.id,
            role: m.role as 'user' | 'assistant',
            segments: [{ text }],
            isAnimating: false,
          };
        });
        setMessages(mapped);
        setLastSyncedSessionId(sessionId);
      } else if (isSessionSwitch && historyMessages.length === 0) {
        setMessages([]);
        setLastSyncedSessionId(sessionId);
      }
    }
  }, [historyMessages, isLoadingHistory, sessionId, lastSyncedSessionId, messages.length]);

  // 3. Auto-select or Auto-create session on mount
  useEffect(() => {
    if (!sessionId && sessions !== undefined && !isLoadingSessions) {
      // Find latest session for this gig
      const gigSessions = (sessions as any[] || []).filter((s: any) => s.gig_id === gigId);
      
      if (gigSessions.length > 0) {
        setSessionId(gigSessions[0].id);
      } else if (!autoCreatedSessionRef.current) {
        // Create a new session ONLY ONCE if none exist for this gig
        const autoCreate = async () => {
          if (isCreatingSession.current) return;
          isCreatingSession.current = true;
          try {
            const newSession = await createSession.mutateAsync({ 
              gigId: gigId as string,
              title: gig ? `Setlist: ${gig.name}` : 'New Conversation'
            });
            autoCreatedSessionRef.current = newSession.id;
            setSessionId(newSession.id);
            setLastSyncedSessionId(newSession.id);
          } catch (e) {
            console.error("Auto-session creation failed:", e);
          } finally {
            isCreatingSession.current = false;
          }
        };
        autoCreate();
      }
    }
  }, [sessions, isLoadingSessions, gigId, sessionId, gig]);

  // Scroll to bottom
  useEffect(() => {
    if (messages.length > 0 || aiMutation.isPending) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, aiMutation.isPending]);

  const showWelcome = messages.length === 0 && !isLoadingHistory && !isLoadingSessions && sessionId;

  const handleNewChat = async () => {
    try {
      const newSession = await createSession.mutateAsync({ 
        gigId: gigId as string,
        title: gig ? `Setlist: ${gig.name}` : 'New Conversation'
      });
      setSessionId(newSession.id);
      setLastSyncedSessionId(newSession.id);
      setMessages([]);
    } catch (e) {
      console.error("Failed to create session:", e);
    }
  };

  const handleSend = async (overrideMsg?: string) => {
    const text = overrideMsg || input.trim();
    if (!text || !sessionId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      segments: [{ text }],
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Intelligently name the session from the user's first prompt
    const isFirstMsg = messages.length === 0 && (!historyMessages || historyMessages.length === 0);
    if (isFirstMsg && sessionId) {
      const cleanTitle = text.length > 38 ? text.slice(0, 38).trim() + '...' : text;
      supabase
        .from('ai_sessions')
        .update({ title: cleanTitle })
        .eq('id', sessionId)
        .then(({ error }) => {
          if (error) console.warn('Could not update session title:', error.message);
          queryClient.invalidateQueries({ queryKey: ['ai-sessions'] });
        });
    }

    try {
      const response = await aiMutation.mutateAsync({
        sessionId,
        message: text,
        clientMsgId: userMsg.id,
      });

      const { text: cleanReply } = parseAIMessage(response.reply);
      const aiReply: Message = {
        id: response.messageId,
        role: 'assistant',
        segments: [{ text: cleanReply }],
        isAnimating: true,
      };

      setMessages((prev) => [...prev, aiReply]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error: any) {
      console.error('AI error:', error);
      const code = (error as AgentError)?.code;
      const replyText =
        code === 'rate_limited'
          ? error.message
          : code === 'unauthenticated'
          ? 'Your session expired. Please sign in again to keep chatting.'
          : "Sorry, I'm having trouble right now. Please try sending your message again in a moment.";

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', segments: [{ text: replyText }] },
      ]);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need photo library permissions to make this work!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      processExtraction(result.assets[0].uri);
    }
  };

  const handleCaptureImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      processExtraction(result.assets[0].uri);
    }
  };

  const processExtraction = async (uri: string) => {
    setIsExtracting(true);
    try {
      // 1. Resize Image (Critical for memory and upload speed)
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1600 } }], // Reasonable resolution for AI extraction
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const fileName = `${Date.now()}.jpg`;
      const filePath = `extractions/${fileName}`;
      // 2. Read file as ArrayBuffer safely (Universal helper)
      const arrayBuffer = await readAsArrayBuffer(manipulated.uri);

      // 3. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('song-screenshots')
        .upload(filePath, arrayBuffer, { 
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 4. Trigger AI Analysis
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const { data, error } = await supabase.functions.invoke('extract-songs', {
        body: { filePath },
        headers: {
          'X-Auth-Token': token || ''
        }
      });

      if (error) throw error;

      if (data.songs && data.songs.length > 0) {
        // OCR output is untrusted: strip control chars/line breaks and cap size before it reaches the agent
        const clean = (v: any, max: number) => String(v ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max);
        const songList = data.songs
          .slice(0, 30)
          .map((s: any) => {
            // Artists the model guessed (not shown in the screenshot) must be confirmed before they're saved
            const check = s.artist_source === 'image' ? '' : ', artist not shown in image - please confirm';
            return `- ${clean(s.title, 100)} by ${clean(s.artist, 100)} (${clean(s.genre || 'Music', 30)}${check})`;
          })
          .join('\n');
        handleSend(`I've uploaded a screenshot. Please help me add these extracted songs to my music dictionary:\n${songList}`);
      } else {
        handleSend("I uploaded an image but couldn't find any songs. Can you help me check if it's clear enough?");
      }
    } catch (e: any) {
      console.error("Extraction failed:", e);
      // Enhanced feedback for troubleshooting
      const errorMsg = e.message?.includes('status 500') 
        ? "The analysis service is currently overwhelmed. Could you try again in a moment?"
        : "Sorry, I had trouble reading that image. Could you try uploading it again?";
      handleSend(errorMsg);
    } finally {
      setIsExtracting(false);
    }
  };

  // Filter sessions to only show those WITH messages in the history UI
  const filteredSessions = (sessions as any[] || []).filter((s: any) => s.ai_messages && s.ai_messages.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border, paddingTop: insets.top + (Platform.OS === 'ios' ? 10 : 20), height: 74 + insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={20} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={[styles.agentAvatar, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
            <Text style={[styles.agentAvatarIcon, { color: colors.primaryDark }]}>✦</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>✦ TukarTa Bot</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={[styles.headerStatus, { color: colors.textDim }]}>
                {sessionId ? `Active Session` : 'Creating Session...'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.historyBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border, borderWidth: 1 }]} 
          onPress={() => setIsHistoryVisible(true)}
          activeOpacity={0.7}
        >
          <History size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isHistoryVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsHistoryVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Chat History</Text>
              <TouchableOpacity onPress={() => setIsHistoryVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.newChatBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]} 
              onPress={() => {
                setIsHistoryVisible(false);
                handleNewChat();
              }}
            >
              <Plus size={20} color={colors.primaryDark} />
              <Text style={[styles.newChatText, { color: colors.primaryDark }]}>Start New Conversation</Text>
            </TouchableOpacity>

            {isLoadingSessions ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={filteredSessions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  let displayTitle = item.title;
                  const isGeneric = !displayTitle || 
                    displayTitle === 'New Planning Session' || 
                    displayTitle === 'New Conversation' || 
                    displayTitle.startsWith('Chat for');

                  if (isGeneric) {
                    const userMsgs = (item.ai_messages || [])
                      .filter((m: any) => m.role === 'user')
                      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

                    if (userMsgs.length > 0 && userMsgs[0].content) {
                      const clean = userMsgs[0].content.trim().replace(/^[\W_]+/, '');
                      displayTitle = clean.length > 38 ? clean.slice(0, 38).trim() + '...' : clean;
                    } else if (item.gigs?.name) {
                      displayTitle = `Setlist: ${item.gigs.name}`;
                    } else {
                      displayTitle = 'Setlist Conversation';
                    }
                  }

                  return (
                    <TouchableOpacity 
                      style={[
                        styles.sessionItem, 
                        { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                        sessionId === item.id && { borderColor: colors.primary, borderWidth: 1.5 }
                      ]}
                      onPress={() => {
                        setSessionId(item.id);
                        setIsHistoryVisible(false);
                      }}
                    >
                      <View style={styles.sessionInfo}>
                        <Text style={[styles.sessionTitle, { color: colors.text }]} numberOfLines={1}>{displayTitle}</Text>
                        <Text style={[styles.sessionDate, { color: colors.textDim }]}>
                          {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      {sessionId === item.id && <Circle size={8} color={colors.primary} fill={colors.primary} />}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptySessionsWrapper}>
                    <Text style={[styles.emptySessions, { color: colors.text }]}>No past conversations found.</Text>
                    <Text style={[styles.emptySessionsSub, { color: colors.textDim }]}>Start a conversation to see it here.</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 74 + insets.top : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
        >
          {showWelcome && (
            <View style={styles.welcomeContainer}>
              <View style={[styles.agentAvatarLarge, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
                <Text style={[styles.agentAvatarIconLarge, { color: colors.primary }]}>✦</Text>
              </View>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                {gig ? `Planning for ${gig.name}` : 'How can I help today?'}
              </Text>
              <Text style={[styles.welcomeSub, { color: colors.textDim }]}>
                I can help you build setlists, hire musicians, or plan your next performance.
              </Text>
            </View>
          )}

          {isLoadingHistory && sessionId && (
             <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          )}

          {messages.map((msg) => (
            <View key={msg.id}>
              <View style={[styles.msgWrapper, msg.role === 'user' ? styles.msgWrapperUser : styles.msgWrapperAI]}>
                <View 
                  style={[
                    styles.msgBubble, 
                    msg.role === 'user' 
                      ? [styles.msgBubbleUser, { backgroundColor: colors.primary }] 
                      : [styles.msgBubbleAI, { backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }]
                  ]}
                >
                  {msg.role === 'assistant' && (
                    <Text style={[styles.aiLabel, { color: colors.primary }]}>TUKARTA BOT</Text>
                  )}
                  
                  {msg.role === 'assistant' && msg.isAnimating ? (
                    <TypewriterText 
                      segments={msg.segments} 
                      onComplete={() => {
                        setMessages(prev => prev.map(m => 
                          m.id === msg.id ? { ...m, isAnimating: false } : m
                        ));
                      }} 
                    />
                  ) : (
                    <RichText segments={msg.segments} isUser={msg.role === 'user'} colors={colors} />
                  )}
                  
                </View>
              </View>

              {msg.role === 'assistant' && (proposalsByMessage[msg.id]?.length ?? 0) > 0 && (
                <View style={styles.proposalsContainer}>
                  {proposalsByMessage[msg.id].map((pr) => (
                    <ProposalCard
                      key={pr.id}
                      proposal={pr}
                      busy={decidingIds.includes(pr.id) || pr.status === 'executing'}
                      onApprove={() => decide([pr.id], 'approve')}
                      onReject={() => decide([pr.id], 'reject')}
                      onEdit={() => setEditingProposal(pr)}
                    />
                  ))}
                  {(() => {
                    const bulk = proposalsByMessage[msg.id].filter((x) => x.status === 'pending' && x.risk !== 'high');
                    if (bulk.length < 2) return null;
                    return (
                      <TouchableOpacity
                        style={[styles.approveAllBtn, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
                        onPress={() => decide(bulk.map((x) => x.id), 'approve')}
                        disabled={bulk.some((x) => decidingIds.includes(x.id))}
                      >
                        <Check size={15} color={colors.primaryDark} strokeWidth={3} />
                        <Text style={[styles.approveAllText, { color: colors.primaryDark }]}>
                          Approve all {bulk.length} (invites are always approved one by one)
                        </Text>
                      </TouchableOpacity>
                    );
                  })()}
                </View>
              )}
            </View>
          ))}
          
          {aiMutation.isPending && <TypingIndicator />}
        </ScrollView>

        <View style={[styles.inputOuter, { backgroundColor: colors.bg, paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
          <View style={[styles.inputInner, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <View style={styles.actionBtns}>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }]} 
                onPress={handleCaptureImage} 
                disabled={isExtracting}
                activeOpacity={0.7}
              >
                <Camera size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }]} 
                onPress={handlePickImage} 
                disabled={isExtracting}
                activeOpacity={0.7}
              >
                <ImageIcon size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.input,
                { color: colors.inputText },
                Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
              ]}
              placeholder={isExtracting ? "Extracting songs..." : "e.g. 'Plan a bar gig for next Friday'"}
              placeholderTextColor={colors.inputPlaceholder}
              value={input}
              onChangeText={setInput}
              multiline
              editable={!aiMutation.isPending && !!sessionId && !isExtracting}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, { backgroundColor: colors.primary }, (!input.trim() || !sessionId || isExtracting) && { opacity: 0.5 }]} 
              onPress={() => handleSend()}
              disabled={!input.trim() || aiMutation.isPending || !sessionId || isExtracting}
            >
              {aiMutation.isPending || isExtracting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Send size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <EditProposalModal
        proposal={editingProposal}
        onClose={() => setEditingProposal(null)}
        onSave={(edits) => {
          const target = editingProposal;
          setEditingProposal(null);
          if (target) decide([target.id], 'approve', edits);
        }}
      />
    </View>
  );
}

function RichText({ segments, isUser, colors }: { segments: Segment[]; isUser: boolean; colors?: any }) {
  const textColor = isUser ? '#FFFFFF' : (colors?.text || '#166534');
  const highlightColor = isUser ? '#FFFFFF' : (colors?.primaryDark || '#065F46');

  return (
    <Text style={[styles.msgText, { color: textColor }]}>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <Text key={i} style={[styles.highlight, { color: highlightColor }]}>{seg.text}</Text>
        ) : (
          <Text key={i}>{seg.text}</Text>
        )
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  proposalKind: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, marginBottom: 2 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, alignSelf: 'flex-start' },
  statusChipText: { fontSize: 11, fontWeight: '800' },
  proposalLines: { borderTopWidth: 1, paddingTop: 8, marginTop: 10, paddingHorizontal: 16, gap: 3 },
  proposalLine: { fontSize: 12.5, lineHeight: 17 },
  setlistEditRow: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 8 },
  setlistEditSong: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setlistEditChips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingLeft: 26 },
  setlistEditChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  setlistEditChipText: { fontSize: 11, fontWeight: '700' },
  setlistEditHint: { fontSize: 11.5, lineHeight: 16 },
  proposalActionsBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  proposalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
  },
  proposalBtnPrimary: { borderColor: 'transparent' },
  proposalBtnText: { fontSize: 13, fontWeight: '800' },
  approveAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    paddingHorizontal: 12,
  },
  approveAllText: { fontSize: 12.5, fontWeight: '800', flexShrink: 1 },
  editLabel: { fontSize: 12.5, fontWeight: '700', marginBottom: 6 },
  editInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  editSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    marginTop: 4,
  },
  editSaveText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 12,
  },
  backText: {
    fontSize: 14,
    fontFamily: 'DM Sans',
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  agentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  agentAvatarIcon: {
    fontSize: 18,
  },
  headerInfo: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  headerStatus: {
    fontSize: 11,
    fontFamily: 'DM Sans',
  },
  historyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  agentAvatarLarge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  agentAvatarIconLarge: {
    fontSize: 36,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'DM Sans',
  },
  welcomeSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'DM Sans',
  },
  msgWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  msgWrapperAI: {
    justifyContent: 'flex-start',
  },
  msgWrapperUser: {
    justifyContent: 'flex-end',
  },
  msgBubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 20,
  },
  msgBubbleAI: {
    borderBottomLeftRadius: 4,
  },
  msgBubbleUser: {
    borderBottomRightRadius: 4,
  },
  aiLabel: {
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 1.2,
    fontFamily: 'DM Sans',
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'DM Sans',
  },
  msgTextUser: {
    color: '#FFFFFF',
  },
  highlight: {
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  badge: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 13,
    fontStyle: 'italic',
    fontFamily: 'DM Sans',
  },
  proposalsContainer: {
    paddingHorizontal: 10,
    marginBottom: 18,
    gap: 8,
  },
  proposalCard: {
    // Grows with its song list and buttons; a fixed height clipped them
    paddingTop: 14,
    paddingBottom: 14,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  proposalCardActive: {
    borderWidth: 1.5,
  },
  proposalContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  proposalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  proposalTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  proposalTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  proposalSubtitle: {
    fontSize: 12,
    marginTop: 1,
    fontFamily: 'DM Sans',
  },
  proposalRight: {
    marginLeft: 10,
  },
  proposalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  approveMiniBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  approveMiniText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    fontFamily: 'DM Sans',
  },
  miniCancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  checkboxActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputOuter: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 4,
    borderWidth: 1,
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    gap: 4,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
    fontFamily: 'DM Sans',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '70%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  newChatText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  activeSessionItem: {
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'DM Sans',
  },
  sessionDate: {
    fontSize: 12,
    fontFamily: 'DM Sans',
  },
  emptySessionsWrapper: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptySessions: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  emptySessionsSub: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'DM Sans',
  },
});
