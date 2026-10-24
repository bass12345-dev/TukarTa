import React from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TextInputProps, 
  Platform 
} from 'react-native';
import { useAppTheme } from '../../context/theme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const TextField: React.FC<TextFieldProps> = ({ 
  label, 
  error, 
  leftIcon, 
  style, 
  placeholderTextColor,
  ...props 
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        {
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
        },
        props.multiline && styles.inputWrapperMultiline,
        error ? styles.inputError : null,
      ]}>
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, { color: colors.inputText }, style]}
          placeholderTextColor={placeholderTextColor || colors.inputPlaceholder}
          selectionColor={colors.primary}
          autoCapitalize="none"
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    marginLeft: 4,
    fontFamily: 'DM Sans',
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 0,
  },
  inputWrapperMultiline: {
    height: undefined,
    minHeight: 100,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  iconContainer: {
    marginRight: 12,
    opacity: 0.8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DM Sans',
    height: '100%',
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'DM Sans',
  },
});
