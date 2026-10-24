import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { X, QrCode, Radio, Guitar, Drum, Mic, Piano, Music } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme';
import { useBandSession, MemberRole } from '../../context/bandSession';
import { useRouter } from 'expo-router';

interface JoinSessionModalProps {
  visible: boolean;
  onClose: () => void;
  defaultCode?: string;
}

const ROLES: { id: MemberRole; label: string; icon: any }[] = [
  { id: 'guitar', label: 'Guitar', icon: Guitar },
  { id: 'bass', label: 'Bass', icon: Guitar },
  { id: 'vocals', label: 'Vocals', icon: Mic },
  { id: 'keys', label: 'Keys', icon: Piano },
  { id: 'drums', label: 'Drums', icon: Drum },
  { id: 'other', label: 'Other', icon: Music },
];

export function JoinSessionModal({ visible, onClose, defaultCode = '' }: JoinSessionModalProps) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { joinSession } = useBandSession();

  const [code, setCode] = useState(defaultCode);
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<MemberRole>('guitar');
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!code.trim()) {
      setErrorMsg('Please enter the 4-6 digit session code');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Please enter your name or nickname');
      return;
    }

    setErrorMsg(null);
    setIsJoining(true);

    try {
      const success = await joinSession(code.trim().toUpperCase(), {
        name: name.trim(),
        role: selectedRole,
      });

      if (success) {
        onClose();
        // Route immediately to Stage Mode in synchronized follower mode!
        router.push('/stage-mode');
      } else {
        setErrorMsg('Could not find live session. Check the code and try again.');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to connect to session.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <View style={[styles.iconCircle, { backgroundColor: '#10B98115' }]}>
                <Radio size={20} color="#10B981" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Join Band Session</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Sync chords & teleprompter with leader
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Session Code Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>PAIRING CODE</Text>
            <TextInput
              style={[
                styles.codeInput,
                {
                  backgroundColor: colors.bgSecondary,
                  borderColor: errorMsg ? '#EF4444' : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. TK-84A2"
              placeholderTextColor={colors.textDim}
              value={code}
              onChangeText={(text) => {
                setCode(text.toUpperCase());
                if (errorMsg) setErrorMsg(null);
              }}
              autoCapitalize="characters"
              maxLength={8}
            />
          </View>

          {/* Musician Name Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>YOUR NAME / STAGE NAME</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.bgSecondary,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. Juan (Lead Guitar)"
              placeholderTextColor={colors.textDim}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Instrument / Role Selection */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>YOUR INSTRUMENT / ROLE</Text>
            <View style={styles.rolesGrid}>
              {ROLES.map((r) => {
                const isSelected = selectedRole === r.id;
                const IconComponent = r.icon;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.roleChip,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? '#064E3B'
                            : '#D1FAE5'
                          : colors.bgSecondary,
                        borderColor: isSelected ? '#10B981' : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedRole(r.id)}
                  >
                    <IconComponent
                      size={14}
                      color={isSelected ? '#10B981' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.roleChipText,
                        { color: isSelected ? '#10B981' : colors.text },
                        isSelected && { fontWeight: '700' },
                      ]}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Error Message */}
          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={onClose}
              disabled={isJoining}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: '#10B981' }]}
              onPress={handleJoin}
              disabled={isJoining}
            >
              {isJoining ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.joinBtnText}>Connect to Band</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 22,
    gap: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: 0.5,
  },
  codeInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'JetBrains Mono',
    letterSpacing: 2,
    textAlign: 'center',
  },
  textInput: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 12,
    fontFamily: 'DM Sans',
  },
  errorBox: {
    padding: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: 'DM Sans',
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  joinBtn: {
    flex: 2,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
});
