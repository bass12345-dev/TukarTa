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
  Share2,
} from 'lucide-react-native';
import { CreateBandModal } from '../../components/bands/CreateBandModal';
import { useAuth } from '../../context/auth';
import { useMyBands } from '../../utils/hooks/useMusician';
import { useAppTheme } from '../../context/theme';

export default function BandSessionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'sync' | 'bands'>('sync');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: bands, isLoading } = useMyBands();

  const handleMuteOthers = () => {
    if (Platform.OS === 'web') {
      window.alert('Muted audio output on all connected member devices.');
    } else {
      Alert.alert('Session Control', 'Muted audio output on all connected member devices.');
    }
  };

  const handleResync = () => {
    if (Platform.OS === 'web') {
      window.alert('Re-synchronized teleprompter scroll and metronome across all devices.');
    } else {
      Alert.alert('Session Control', 'Re-synchronized teleprompter scroll and metronome across all devices.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <CreateBandModal 
        visible={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.title, { color: colors.text }]}>Band Session</Text>
          <TouchableOpacity 
            style={[styles.createBtn, { backgroundColor: colors.primary }]} 
            activeOpacity={0.8}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.createBtnText}>New Band</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { color: colors.textDim }]}>Sync lyrics and audio across all devices</Text>

        {/* Tab switch */}
        <View style={[styles.tabSwitch, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.switchBtn, 
              activeTab === 'sync' && [styles.switchBtnActive, { backgroundColor: colors.bgCard }]
            ]}
            onPress={() => setActiveTab('sync')}
          >
            <Text style={[
              styles.switchText, 
              { color: activeTab === 'sync' ? (isDark ? colors.accent : colors.primaryDark) : colors.textDim },
              activeTab === 'sync' && styles.switchTextActive
            ]}>
              LIVE SYNC
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.switchBtn, 
              activeTab === 'bands' && [styles.switchBtnActive, { backgroundColor: colors.bgCard }]
            ]}
            onPress={() => setActiveTab('bands')}
          >
            <Text style={[
              styles.switchText, 
              { color: activeTab === 'bands' ? (isDark ? colors.accent : colors.primaryDark) : colors.textDim },
              activeTab === 'bands' && styles.switchTextActive
            ]}>
              MY BANDS ({bands?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'sync' ? (
          <>
            {/* ── Pairing Card ── */}
            <View style={[styles.pairingCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.pairingTitle, { color: colors.primary }]}>PAIRING CODE</Text>

              {/* QR Container */}
              <View style={[styles.qrOuter, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                <View style={[styles.qrInner, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                  <QrCode size={52} color={colors.primary} strokeWidth={1.8} />
                </View>
              </View>

              {/* 4-Letter Code Blocks */}
              <View style={styles.codeRow}>
                {['T', 'U', 'K', 'A'].map((char, index) => (
                  <View key={index} style={[styles.codeBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                    <Text style={[styles.codeChar, { color: colors.text }]}>{char}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.pairingHint, { color: colors.textDim }]}>
                Scan QR or enter code to join as a band member
              </Text>
            </View>

            {/* ── Connected Devices Section ── */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CONNECTED DEVICES (3)</Text>
              <View style={styles.statusIndicator}>
                <View style={styles.pulseDot} />
                <Text style={styles.statusText}>LEADER ACTIVE</Text>
              </View>
            </View>

            <View style={styles.devicesList}>
              {/* Leader Device */}
              <View style={[styles.leaderCard, { backgroundColor: isDark ? '#064E3B' : '#166534' }]}>
                <View style={styles.leaderIconBox}>
                  <Crown size={20} color="#FFFFFF" />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.leaderName}>iPhone 15 Pro (You)</Text>
                  <Text style={styles.leaderMeta}>Session Leader • Latency: 0ms</Text>
                </View>
                <View style={styles.broadcastingBadge}>
                  <Text style={styles.broadcastingText}>BROADCASTING</Text>
                </View>
              </View>

              {/* Member 1: iPad Air */}
              <View style={[styles.memberCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <View style={[styles.memberIconBox, { backgroundColor: colors.bgSecondary }]}>
                  <Tablet size={18} color={colors.primary} />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={[styles.memberName, { color: colors.text }]}>iPad Air</Text>
                  <Text style={[styles.memberMeta, { color: colors.textDim }]}>Member • Latency: 12ms</Text>
                </View>
                <View style={styles.memberStatusRow}>
                  <Text style={styles.syncText}>IN SYNC</Text>
                  <View style={styles.syncDotGreen} />
                </View>
              </View>

              {/* Member 2: Pixel 8 */}
              <View style={[styles.memberCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <View style={[styles.memberIconBox, { backgroundColor: colors.bgSecondary }]}>
                  <Smartphone size={18} color={colors.primary} />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={[styles.memberName, { color: colors.text }]}>Pixel 8</Text>
                  <Text style={[styles.memberMeta, { color: colors.textDim }]}>Member • Latency: 45ms</Text>
                </View>
                <View style={styles.memberStatusRow}>
                  <Text style={styles.lagText}>LAGGING</Text>
                  <View style={styles.syncDotAmber} />
                </View>
              </View>
            </View>

            {/* ── Session Control ── */}
            <View style={styles.controlSection}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SESSION CONTROL</Text>
              <View style={styles.controlGrid}>
                <TouchableOpacity 
                  style={[styles.controlCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                  activeOpacity={0.8}
                  onPress={handleMuteOthers}
                >
                  <VolumeX size={20} color={colors.primary} style={{ marginBottom: 6 }} />
                  <Text style={[styles.controlText, { color: colors.text }]}>MUTE OTHERS</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.controlCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                  activeOpacity={0.8}
                  onPress={handleResync}
                >
                  <RotateCw size={20} color={colors.primary} style={{ marginBottom: 6 }} />
                  <Text style={[styles.controlText, { color: colors.text }]}>RE-SYNC ALL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          /* ── My Bands List ── */
          <View style={styles.bandsContainer}>
            {isLoading ? (
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
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No bands joined yet</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textDim }]}>Create a band or enter a pairing code above.</Text>
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
  pairingCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
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
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  qrInner: {
    width: 110,
    height: 110,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  codeBox: {
    width: 44,
    height: 52,
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
    fontFamily: 'DM Sans',
    fontSize: 22,
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
    marginBottom: 24,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM Sans',
    marginBottom: 2,
  },
  leaderMeta: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    fontFamily: 'DM Sans',
  },
  broadcastingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  broadcastingText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: 'DM Sans',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  memberIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
    fontFamily: 'DM Sans',
  },
  memberMeta: {
    fontSize: 11,
    fontFamily: 'DM Sans',
  },
  memberStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  syncText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    fontFamily: 'DM Sans',
  },
  syncDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  lagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    fontFamily: 'DM Sans',
  },
  syncDotAmber: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  controlSection: {
    gap: 10,
  },
  controlGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  controlCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  controlText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: 'DM Sans',
  },
  bandsContainer: {
    gap: 10,
  },
  bandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  bandAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bandAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'DM Sans',
  },
  bandInfo: {
    flex: 1,
  },
  bandName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
    fontFamily: 'DM Sans',
  },
  bandMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bandMetaText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'DM Sans',
  },
  roleBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
    fontFamily: 'DM Sans',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'DM Sans',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 20,
    fontFamily: 'DM Sans',
  },
});
