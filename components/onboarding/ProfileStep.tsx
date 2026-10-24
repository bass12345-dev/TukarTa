import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Camera, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { TextField } from '../ui/TextField';
import { Pill } from '../ui/Pill';
import { StepProps } from './types';
import { useAuth } from '../../context/auth';
import { useAppTheme } from '../../context/theme';

export const ProfileStep: React.FC<StepProps> = ({ data, updateData }) => {
  const { user } = useAuth();
  const { colors, isDark } = useAppTheme();
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      updateData({ avatarUri: result.assets[0].uri });
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Build your profile</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        This is how bands and fellow musicians will see you in the network.
      </Text>
      
      {/* ── Avatar Section ── */}
      <View style={[styles.avatarSection, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.avatarCircle, 
            { 
              borderColor: '#10B981',
              backgroundColor: isDark ? colors.bgSecondary : '#F0FDF4' 
            }
          ]} 
          onPress={pickImage}
          activeOpacity={0.8}
        >
          {data.avatarUri ? (
            <Image source={{ uri: data.avatarUri }} style={styles.avatarImage} />
          ) : (
            <>
              <Camera size={26} color="#10B981" />
              <Text style={styles.avatarText}>ADD PHOTO</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.avatarContent}>
          <Text style={[styles.avatarNote, { color: colors.textSecondary }]}>
            A real photo helps organizers and bands recognize you quickly on stage.
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 4 }}>
            <Pill label="✓ Cloud synced" variant="mint-subtle" />
          </View>
        </View>
      </View>

      <View style={styles.formContainer}>
        <TextField
          label="Stage name / Display name (Required)"
          placeholder="e.g. Ely Buendia or Marco Rivera"
          value={data.stageName}
          onChangeText={(val) => updateData({ stageName: val })}
        />

        {/* Switch: Use a stage name */}
        <TouchableOpacity
          style={[styles.switchRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          onPress={() => updateData({ useStageName: !data.useStageName })}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>Use a stage name</Text>
            <Text style={[styles.switchSub, { color: colors.textSecondary }]}>Different from your personal legal name?</Text>
          </View>
          <View style={[styles.switch, { backgroundColor: data.useStageName ? '#10B981' : (isDark ? colors.border : '#E2E8F0') }]}>
            <View style={[styles.switchKnob, data.useStageName && styles.switchKnobOn]} />
          </View>
        </TouchableOpacity>

        <TextField
          label="Short bio (optional)"
          placeholder="Acoustic singer-guitarist. 8 years live gigging, open for session work..."
          multiline
          numberOfLines={3}
          value={data.bio}
          onChangeText={(val) => updateData({ bio: val })}
        />

        <View style={styles.rateRow}>
          <View style={{ flex: 1.4 }}>
            <TextField
              label="Starting rate (optional)"
              placeholder="₱ 1,500"
              keyboardType="numeric"
              value={data.rate}
              onChangeText={(val) => updateData({ rate: val })}
            />
          </View>
          <View style={{ flex: 1, paddingTop: 24 }}>
            <View style={[styles.selectCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.selectText, { color: colors.text }]}>Per gig</Text>
              <ChevronRight size={16} color={colors.textSecondary} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'DM Sans',
    lineHeight: 20,
    marginBottom: 16,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    fontFamily: 'DM Sans',
    letterSpacing: 0.5,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 43,
  },
  avatarContent: {
    flex: 1,
    gap: 6,
  },
  avatarNote: {
    fontSize: 12.5,
    fontFamily: 'DM Sans',
    lineHeight: 18,
  },
  formContainer: {
    gap: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  switchLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  switchSub: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    marginTop: 2,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  switchKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchKnobOn: {
    alignSelf: 'flex-end',
  },
  rateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  selectCard: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  selectText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
});
