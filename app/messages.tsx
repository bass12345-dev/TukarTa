import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Info, Check, X, Bell, MailOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMyInvites, useAcceptInvite, useDeclineInvite } from '../utils/hooks/useMusician';
import { GlassCard } from '../components/ui/GlassCard';
import { Pill } from '../components/ui/Pill';

export default function MessagesScreen() {
  const router = useRouter();
  const { data: invites, isLoading } = useMyInvites();
  const acceptInvite = useAcceptInvite();
  const declineInvite = useDeclineInvite();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#071420', '#0a1a2f']} style={StyleSheet.absoluteFill} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.tabs}>
           <TouchableOpacity style={[styles.tab, styles.tabActive]}>
              <Text style={styles.tabTextActive}>Invitations</Text>
              {invites && invites.length > 0 && (
                <View style={styles.badge} />
              )}
           </TouchableOpacity>
           <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>Alerts</Text>
           </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#00D4FF" style={{ marginTop: 40 }} />
        ) : invites && invites.length > 0 ? (
          invites.map((invite: any) => (
            <InviteCard 
              key={invite.id} 
              invite={invite} 
              onAccept={() => acceptInvite.mutate(invite.id)}
              onDecline={() => declineInvite.mutate(invite.id)}
              isProcessing={acceptInvite.isPending || declineInvite.isPending}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
                <MailOpen size={48} color="rgba(255,255,255,0.05)" />
            </View>
            <Text style={styles.emptyTitle}>Inboxes are clear!</Text>
            <Text style={styles.emptySub}>When a band invites you, it will appear here.</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

function InviteCard({ invite, onAccept, onDecline, isProcessing }: any) {
  return (
    <GlassCard style={styles.inviteCard} intensity={15}>
      <View style={styles.inviteHeader}>
        <View style={styles.bandAvatar}>
           <Text style={styles.avatarText}>{invite.band?.name?.[0]}</Text>
        </View>
        <View style={styles.inviteMeta}>
          <Text style={styles.fromText}>Band Invitation</Text>
          <Text style={styles.bandName}>{invite.band?.name}</Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationText}>{invite.band?.city || 'Philippines'}</Text>
          </View>
        </View>
        <Pill label="NEW" variant="cyan" />
      </View>

      {invite.message && (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>"{invite.message}"</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.declineBtn]} 
          onPress={onDecline}
          disabled={isProcessing}
        >
          <X size={18} color="rgba(255,255,255,0.4)" />
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtn, styles.acceptBtn]} 
          onPress={onAccept}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#071420" />
          ) : (
            <>
              <Check size={18} color="#071420" />
              <Text style={styles.acceptText}>Join Band</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071420' },
  header: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  tabs: { flexDirection: 'row', gap: 24, marginBottom: 24 },
  tab: { paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#00D4FF' },
  tabText: { fontSize: 15, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans Bold' },
  tabTextActive: { fontSize: 15, color: '#00D4FF', fontFamily: 'DM Sans Bold' },
  badge: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00D4FF' },
  inviteCard: { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  inviteHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  bandAvatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  inviteMeta: { flex: 1 },
  fromText: { fontSize: 11, fontWeight: '700', color: '#00D4FF', letterSpacing: 1.2, marginBottom: 2 },
  bandName: { fontSize: 17, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  locationRow: { marginTop: 2 },
  locationText: { fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans' },
  messageBox: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 16, marginBottom: 20 },
  messageText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontFamily: 'DM Sans', fontStyle: 'italic', lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  declineBtn: { backgroundColor: 'rgba(255,255,255,0.05)' },
  declineText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)', fontFamily: 'DM Sans Bold' },
  acceptBtn: { backgroundColor: '#00D4FF' },
  acceptText: { fontSize: 14, fontWeight: '700', color: '#071420', fontFamily: 'DM Sans Bold' },
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold', marginBottom: 8 },
  emptySub: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontFamily: 'DM Sans', lineHeight: 20 }
});
