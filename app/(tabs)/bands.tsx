import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Crown,
  Tablet,
  Smartphone,
  QrCode,
  VolumeX,
  RotateCw,
  Plus,
  Users,
  Music,
  Radio,
  Play,
  LogOut,
  Sparkles,
  Guitar,
  Drum,
  Mic,
  Piano,
  CheckCircle2,
  Share2,
} from 'lucide-react-native';
import { CreateBandModal } from '../../components/bands/CreateBandModal';
import { JoinSessionModal } from '../../components/bands/JoinSessionModal';
import { CreateSessionModal } from '../../components/bands/CreateSessionModal';
import { QRCodeView } from '../../components/bands/QRCodeView';
import { useAuth } from '../../context/auth';
import { useMyBands } from '../../utils/hooks/useMusician';
import { useAppTheme } from '../../context/theme';
import { useBandSession, MemberRole } from '../../context/bandSession';

import { useTabBarPadding } from '../../utils/hooks/useTabBarPadding';
const ROLE_ICONS: Record<MemberRole, any> = {
  leader: Crown,
  vocals: Mic,
  guitar: Guitar,
  bass: Guitar,
  drums: Drum,
  keys: Piano,
  horns: Music,
  other: Music,
};

export default function BandSessionScreen() {
  const tabBarPadding = useTabBarPadding();
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'sync' | 'bands'>('sync');
  const [showCreateBandModal, setShowCreateBandModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showHostModal, setShowHostModal] = useState(false);

  const { data: bands, isLoading: loadingBands } = useMyBands();

  // Band Session Context
  const {
    sessionCode,
    gigName,
    isLeader,
    connected,
    members,
    currentSong,
    countInNumber,
    broadcastCountIn,
    muteOthers,
    resyncAll,
    leaveSession,
  } = useBandSession();

  const handleMuteOthers = () => {
    muteOthers();
    const msg = 'Muted audio output on all connected member devices.';
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Session Control', msg);
  };

  const handleResync = () => {
    resyncAll();
    const msg = 'Re-synchronized current song chords and teleprompter across all devices.';
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Session Control', msg);
  };

  const handleCountIn = () => {
    broadcastCountIn(120);
  };

  const handleLeaveSession = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to exit this live session?')) {
        await leaveSession();
      }
    } else {
      Alert.alert('Exit Session', 'Are you sure you want to end or leave this live session?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: leaveSession },
      ]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Modals */}
      <CreateBandModal
        visible={showCreateBandModal}
        onClose={() => setShowCreateBandModal(false)}
      />
      <JoinSessionModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        defaultCode={sessionCode || ''}
      />
      <CreateSessionModal
        visible={showHostModal}
        onClose={() => setShowHostModal(false)}
      />

      {/* ── Count In Banner Notification if triggered ── */}
      {countInNumber !== null && (
        <View style={styles.countInOverlay}>
          <Text style={styles.countInText}>{countInNumber}</Text>
          <Text style={styles.countInSub}>COUNT IN</Text>
        </View>
      )}

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.title, { color: colors.text }]}>Band Session</Text>
          {activeTab === 'bands' ? (
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
              onPress={() => setShowCreateBandModal(true)}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.createBtnText}>New Band</Text>
            </TouchableOpacity>
          ) : sessionCode ? (
            <TouchableOpacity
              style={[styles.exitSessionBtn, { borderColor: '#EF4444' }]}
              activeOpacity={0.8}
              onPress={handleLeaveSession}
            >
              <LogOut size={14} color="#EF4444" />
              <Text style={styles.exitSessionText}>{isLeader ? 'End Room' : 'Leave'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={[styles.subtitle, { color: colors.textDim }]}>
          Live teleprompter, chords, & setlists across all devices
        </Text>

        {/* Tab Switch */}
        <View style={[styles.tabSwitch, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.switchBtn,
              activeTab === 'sync' && [styles.switchBtnActive, { backgroundColor: colors.bgCard }],
            ]}
            onPress={() => setActiveTab('sync')}
          >
            <View style={styles.tabContentRow}>
              {sessionCode && <View style={styles.tabPulseDot} />}
              <Text
                style={[
                  styles.switchText,
                  { color: activeTab === 'sync' ? (isDark ? colors.accent : colors.primaryDark) : colors.textDim },
                  activeTab === 'sync' && styles.switchTextActive,
                ]}
              >
                LIVE SYNC {sessionCode ? '(ON)' : ''}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.switchBtn,
              activeTab === 'bands' && [styles.switchBtnActive, { backgroundColor: colors.bgCard }],
            ]}
            onPress={() => setActiveTab('bands')}
          >
            <Text
              style={[
                styles.switchText,
                { color: activeTab === 'bands' ? (isDark ? colors.accent : colors.primaryDark) : colors.textDim },
                activeTab === 'bands' && styles.switchTextActive,
              ]}
            >
              MY BANDS ({bands?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'sync' ? (
          <>
            {/* ── Scenario 1: NO SESSION ACTIVE YET ── */}
            {!sessionCode ? (
              <View style={styles.launcherSection}>
                {/* Host Card */}
                <TouchableOpacity
                  style={[
                    styles.launcherCard,
                    {
                      backgroundColor: colors.bgCard,
                      borderColor: '#10B981',
                    },
                  ]}
                  activeOpacity={0.88}
                  onPress={() => setShowHostModal(true)}
                >
                  <View style={[styles.launcherIconCircle, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
                    <Crown size={28} color="#10B981" />
                  </View>
                  <View style={styles.launcherInfo}>
                    <View style={styles.launcherHeaderRow}>
                      <Text style={[styles.launcherTitle, { color: colors.text }]}>Host Live Session</Text>
                      <View style={styles.leaderBadge}>
                        <Text style={styles.leaderBadgeText}>BAND LEADER</Text>
                      </View>
                    </View>
                    <Text style={[styles.launcherDesc, { color: colors.textSecondary }]}>
                      Generate a QR code & room PIN. Connected band devices will automatically follow your setlist, chords, and teleprompter in real time!
                    </Text>
                    <View style={styles.launcherCta}>
                      <Text style={styles.launcherCtaText}>Start Live Session →</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Join Card */}
                <TouchableOpacity
                  style={[
                    styles.launcherCard,
                    {
                      backgroundColor: colors.bgCard,
                      borderColor: colors.border,
                    },
                  ]}
                  activeOpacity={0.88}
                  onPress={() => setShowJoinModal(true)}
                >
                  <View style={[styles.launcherIconCircle, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                    <Radio size={28} color={isDark ? '#818CF8' : '#6366F1'} />
                  </View>
                  <View style={styles.launcherInfo}>
                    <View style={styles.launcherHeaderRow}>
                      <Text style={[styles.launcherTitle, { color: colors.text }]}>Join Band Session</Text>
                      <View style={[styles.leaderBadge, { backgroundColor: isDark ? '#312E81' : '#EEF2FF' }]}>
                        <Text style={[styles.leaderBadgeText, { color: '#6366F1' }]}>BAND MEMBER</Text>
                      </View>
                    </View>
                    <Text style={[styles.launcherDesc, { color: colors.textSecondary }]}>
                      Scan your leader's QR code or enter the room PIN to turn your phone into a synchronized stage teleprompter and chord sheet!
                    </Text>
                    <View style={styles.launcherCta}>
                      <Text style={[styles.launcherCtaText, { color: '#6366F1' }]}>Enter Code / Join →</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              /* ── Scenario 2: SESSION IS RUNNING ── */
              <>
                {/* Active Session Banner with Stage Mode Quick Launch */}
                <View
                  style={[
                    styles.activeBannerCard,
                    {
                      backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
                      borderColor: '#10B981',
                    },
                  ]}
                >
                  <View style={styles.activeBannerLeft}>
                    <View style={styles.activePulseWrap}>
                      <View style={styles.pulseDot} />
                      <Text style={styles.activeRoomBadge}>
                        {isLeader ? 'BROADCASTING ROOM' : 'SYNCHRONIZED WITH LEADER'}
                      </Text>
                    </View>
                    <Text style={[styles.activeGigName, { color: colors.text }]}>
                      {gigName || 'Live Performance Session'}
                    </Text>
                    {currentSong ? (
                      <Text style={[styles.activeSongText, { color: colors.textSecondary }]}>
                        Now Playing: <Text style={{ fontWeight: '800', color: colors.primary }}>{currentSong.title}</Text> ({currentSong.key})
                      </Text>
                    ) : (
                      <Text style={[styles.activeSongText, { color: colors.textDim }]}>
                        Waiting for song selection...
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.openStageBtn}
                    activeOpacity={0.85}
                    onPress={() => router.push('/stage-mode')}
                  >
                    <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={styles.openStageText}>STAGE MODE</Text>
                  </TouchableOpacity>
                </View>

                {/* ── Pairing Code & QR Card (Leader or Sharing) ── */}
                <View style={[styles.pairingCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                  <Text style={[styles.pairingTitle, { color: colors.primary }]}>ROOM PAIRING CODE</Text>

                  {/* Real Vector QR Code */}
                  <View style={[styles.qrOuter, { backgroundColor: '#FFFFFF', borderColor: colors.border }]}>
                    <QRCodeView value={sessionCode} size={140} color="#10B981" />
                  </View>

                  {/* Display Code Blocks */}
                  <View style={styles.codeRow}>
                    {sessionCode.split('').map((char, index) => (
                      <View
                        key={index}
                        style={[
                          styles.codeBox,
                          {
                            backgroundColor: colors.bgSecondary,
                            borderColor: char === '-' ? 'transparent' : colors.border,
                            width: char === '-' ? 20 : 44,
                          },
                        ]}
                      >
                        <Text style={[styles.codeChar, { color: colors.text }]}>{char}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={[styles.pairingHint, { color: colors.textDim }]}>
                    Bandmates scan this QR or enter code <Text style={{ fontWeight: '800', color: colors.primary }}>{sessionCode}</Text> to join
                  </Text>
                </View>

                {/* ── Connected Devices Section (Realtime Presence) ── */}
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                    CONNECTED DEVICES ({members.length})
                  </Text>
                  <View style={styles.statusIndicator}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.statusText}>
                      {isLeader ? 'LEADER BROADCASTING' : 'MEMBER IN SYNC'}
                    </Text>
                  </View>
                </View>

                <View style={styles.devicesList}>
                  {members.map((member) => {
                    const RoleIcon = ROLE_ICONS[member.role] || Music;
                    const isMe = member.isLeader ? isLeader : !isLeader;
                    return (
                      <View
                        key={member.id}
                        style={[
                          member.isLeader
                            ? [styles.leaderCard, { backgroundColor: isDark ? '#064E3B' : '#166534' }]
                            : [styles.memberCard, { backgroundColor: colors.bgCard, borderColor: colors.border }],
                        ]}
                      >
                        <View
                          style={[
                            member.isLeader
                              ? styles.leaderIconBox
                              : [styles.memberIconBox, { backgroundColor: colors.bgSecondary }],
                          ]}
                        >
                          <RoleIcon
                            size={18}
                            color={member.isLeader ? '#FFFFFF' : colors.primary}
                          />
                        </View>
                        <View style={styles.deviceInfo}>
                          <Text
                            style={[
                              member.isLeader ? styles.leaderName : [styles.memberName, { color: colors.text }],
                            ]}
                          >
                            {member.name} {isMe ? '(You)' : ''}
                          </Text>
                          <Text
                            style={[
                              member.isLeader ? styles.leaderMeta : [styles.memberMeta, { color: colors.textDim }],
                            ]}
                          >
                            {member.role.toUpperCase()} • {member.isLeader ? 'Authoritative Leader' : 'Teleprompter Follower'}
                          </Text>
                        </View>
                        <View style={styles.memberStatusRow}>
                          <Text style={member.isLeader ? styles.broadcastingText : styles.syncText}>
                            {member.isLeader ? 'BROADCASTING' : 'IN SYNC'}
                          </Text>
                          <View style={styles.syncDotGreen} />
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* ── Session Controls (Leader Only) ── */}
                {isLeader && (
                  <View style={styles.controlSection}>
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>STAGE CONTROLS</Text>
                    <View style={styles.controlGrid}>
                      <TouchableOpacity
                        style={[styles.controlCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                        activeOpacity={0.8}
                        onPress={handleCountIn}
                      >
                        <Sparkles size={20} color={colors.primary} style={{ marginBottom: 6 }} />
                        <Text style={[styles.controlText, { color: colors.text }]}>COUNT-IN (4 BEATS)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.controlCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                        activeOpacity={0.8}
                        onPress={handleResync}
                      >
                        <RotateCw size={20} color={colors.primary} style={{ marginBottom: 6 }} />
                        <Text style={[styles.controlText, { color: colors.text }]}>RE-SYNC CHORDS</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.controlCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                        activeOpacity={0.8}
                        onPress={handleMuteOthers}
                      >
                        <VolumeX size={20} color={colors.primary} style={{ marginBottom: 6 }} />
                        <Text style={[styles.controlText, { color: colors.text }]}>MUTE OTHERS</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.controlCard, { backgroundColor: colors.bgCard, borderColor: '#EF4444' }]}
                        activeOpacity={0.8}
                        onPress={handleLeaveSession}
                      >
                        <LogOut size={20} color="#EF4444" style={{ marginBottom: 6 }} />
                        <Text style={[styles.controlText, { color: '#EF4444' }]}>END SESSION</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        ) : (
          /* ── Tab 2: My Bands List ── */
          <View style={styles.bandsContainer}>
            {loadingBands ? (
              <Text style={[styles.emptyText, { color: colors.textDim }]}>Loading bands...</Text>
            ) : bands && bands.length > 0 ? (
              bands.map((item: any) => {
                const bName = item.band?.name || 'Band';
                const bInitials = bName.slice(0, 2).toUpperCase();
                const bRole = (item.role || 'Member').toUpperCase();
                const memberCount = item.band?.member_count?.[0]?.count || 1;
                const genresText = item.band?.genres?.slice(0, 2).join(', ') || 'OPM, Rock';
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.bandCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                    activeOpacity={0.8}
                    onPress={() => item.band?.id && router.push(`/musician/band/${item.band.id}`)}
                  >
                    <View style={[styles.bandAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={styles.bandAvatarText}>{bInitials}</Text>
                    </View>
                    <View style={styles.bandInfo}>
                      <Text style={[styles.bandName, { color: colors.text }]}>{bName}</Text>
                      <View style={styles.bandMetaRow}>
                        <Users size={12} color={colors.primary} />
                        <Text style={[styles.bandMetaText, { color: colors.textDim }]}>
                          {memberCount} members
                        </Text>
                        <Text style={[styles.bandMetaText, { color: colors.textDim }]}>•</Text>
                        <Text style={[styles.bandMetaText, { color: colors.textDim }]}>
                          {genresText}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                      <Text style={[styles.roleBadgeText, { color: colors.primary }]}>{bRole}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <Users size={36} color={colors.primary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No bands created yet</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textDim }]}>
                  Tap "New Band" above to create your band and assemble your lineup.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'DM Sans',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
    fontFamily: 'DM Sans',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  createBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM Sans',
  },
  exitSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  exitSessionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    fontFamily: 'DM Sans',
  },
  tabSwitch: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 10,
  },
  switchBtnActive: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  switchText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'DM Sans',
  },
  switchTextActive: {
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 90,
  },
  launcherSection: {
    gap: 14,
  },
  launcherCard: {
    borderWidth: 1.5,
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  launcherIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launcherInfo: {
    flex: 1,
    gap: 4,
  },
  launcherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  launcherTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.2,
  },
  leaderBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  leaderBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    fontFamily: 'DM Sans',
  },
  launcherDesc: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    lineHeight: 16,
  },
  launcherCta: {
    marginTop: 4,
  },
  launcherCtaText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#10B981',
    fontFamily: 'DM Sans',
  },
  activeBannerCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  activeBannerLeft: {
    flex: 1,
    gap: 3,
  },
  activePulseWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeRoomBadge: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#10B981',
    fontFamily: 'DM Sans',
    letterSpacing: 0.5,
  },
  activeGigName: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.2,
  },
  activeSongText: {
    fontSize: 12,
    fontFamily: 'DM Sans',
  },
  openStageBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  openStageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: 0.5,
  },
  pairingCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  pairingTitle: {
    fontFamily: 'DM Sans',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  qrOuter: {
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    alignItems: 'center',
  },
  codeBox: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  codeChar: {
    fontFamily: 'JetBrains Mono',
    fontSize: 20,
    fontWeight: '800',
  },
  pairingHint: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'DM Sans',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontFamily: 'DM Sans',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    fontFamily: 'DM Sans',
  },
  devicesList: {
    gap: 10,
    marginBottom: 20,
  },
  leaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  leaderIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  leaderName: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
  leaderMeta: {
    color: '#A7F3D0',
    fontSize: 11,
    fontFamily: 'DM Sans',
    marginTop: 1,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  memberIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
  memberMeta: {
    fontSize: 11,
    fontFamily: 'DM Sans',
    marginTop: 1,
  },
  memberStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  broadcastingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'DM Sans',
    letterSpacing: 0.5,
  },
  syncText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  syncDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  controlSection: {
    marginBottom: 20,
  },
  controlGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  controlCard: {
    width: '48.5%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'DM Sans',
    textAlign: 'center',
  },
  bandsContainer: {
    gap: 12,
  },
  bandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  bandAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bandAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    fontFamily: 'DM Sans',
  },
  bandInfo: {
    flex: 1,
    gap: 2,
  },
  bandName: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  bandMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bandMetaText: {
    fontSize: 11,
    fontFamily: 'DM Sans',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'DM Sans',
    textAlign: 'center',
    paddingVertical: 20,
  },
  countInOverlay: {
    position: 'absolute',
    top: 100,
    left: '50%',
    transform: [{ translateX: -70 }],
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  countInText: {
    fontSize: 54,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'DM Sans',
  },
  countInSub: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    fontFamily: 'DM Sans',
  },
});
