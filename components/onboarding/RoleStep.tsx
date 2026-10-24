import { Check } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ROLES } from './constants';
import { StepProps } from './types';
import { useAppTheme } from '../../context/theme';

export const RoleStep: React.FC<StepProps> = ({ data, updateData }) => {
  const { colors, isDark } = useAppTheme();

  const toggleRole = (roleId: string) => {
    const newRoles = data.selectedRoles.includes(roleId)
      ? data.selectedRoles.filter(r => r !== roleId)
      : [...data.selectedRoles, roleId];
    updateData({ selectedRoles: newRoles });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>What do you play?</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Choose all roles that apply. Bands can discover and hire you based on these skills.
      </Text>
      
      <View style={styles.roleGrid}>
        {ROLES.map((role) => {
          const isActive = data.selectedRoles.includes(role.id);
          return (
            <TouchableOpacity
              key={role.id}
              onPress={() => toggleRole(role.id)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: isActive 
                      ? (isDark ? '#16382C' : '#ECFDF5') 
                      : colors.bgCard,
                    borderColor: isActive ? '#10B981' : colors.border,
                    borderWidth: isActive ? 1.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.roleIconBox,
                    {
                      backgroundColor: isActive 
                        ? '#10B981' 
                        : (isDark ? '#1F3F34' : '#F0FDF4'),
                    },
                  ]}
                >
                  <role.icon
                    size={20}
                    color={isActive ? '#FFFFFF' : '#10B981'}
                    strokeWidth={2.2}
                  />
                </View>

                <View style={styles.roleInfo}>
                  <Text style={[styles.roleLabel, { color: colors.text }]}>
                    {role.label}
                  </Text>
                  <Text style={[styles.roleSub, { color: colors.textSecondary }]}>
                    {role.sub}
                  </Text>
                </View>

                <View
                  style={[
                    styles.checkbox,
                    { borderColor: isActive ? '#10B981' : colors.border },
                    isActive && styles.checkboxActive,
                  ]}
                >
                  {isActive && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
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
  roleGrid: {
    gap: 10,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  roleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleInfo: {
    flex: 1,
    marginLeft: 14,
  },
  roleLabel: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    marginBottom: 2,
  },
  roleSub: {
    fontSize: 12,
    fontFamily: 'DM Sans',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
});
