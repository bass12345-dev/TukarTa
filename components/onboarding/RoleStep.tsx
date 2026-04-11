import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { ROLES } from './constants';
import { StepProps } from './types';

export const RoleStep: React.FC<StepProps> = ({ data, updateData }) => {
  const toggleRole = (roleId: string) => {
    const newRoles = data.selectedRoles.includes(roleId)
      ? data.selectedRoles.filter(r => r !== roleId)
      : [...data.selectedRoles, roleId];
    updateData({ selectedRoles: newRoles });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What do you play?</Text>
      <Text style={styles.subtitle}>Choose all roles that apply. Bands can search for you based on this.</Text>
      
      <View style={styles.roleGrid}>
        {ROLES.map((role) => {
          const isActive = data.selectedRoles.includes(role.id);
          return (
            <TouchableOpacity
              key={role.id}
              onPress={() => toggleRole(role.id)}
              activeOpacity={0.7}
            >
              <GlassCard
                style={[styles.roleCard, isActive && styles.roleCardActive]}
                intensity={isActive ? 25 : 10}
              >
                <View style={[styles.roleIconBox, isActive && styles.roleIconBoxActive]}>
                  <role.icon size={22} color={isActive ? "#00D4FF" : "#FFF"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roleLabel}>{role.label}</Text>
                  <Text style={styles.roleSub}>{role.sub}</Text>
                </View>
                <View style={[styles.checkbox, isActive && styles.checkboxActive]}>
                  {isActive && <Check size={14} color="#FFF" />}
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  subtitle: { fontSize: 15, color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'DM Sans', lineHeight: 22, marginBottom: 20 },
  roleGrid: { gap: 12 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  roleCardActive: { borderColor: 'rgba(0, 212, 255, 0.4)' },
  roleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconBoxActive: { backgroundColor: 'rgba(0, 212, 255, 0.1)' },
  roleLabel: { fontSize: 16, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  roleSub: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'DM Sans' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: '#00D4FF', borderColor: '#00D4FF' },
});
