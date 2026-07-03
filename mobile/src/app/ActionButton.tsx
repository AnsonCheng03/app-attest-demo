import React from 'react';
import { Pressable, Text } from 'react-native';
import { styles } from './styles';

export function ActionButton({
  label,
  onPress,
  subtitle,
  variant = 'default',
}: {
  label: string;
  onPress: () => void;
  subtitle?: string;
  variant?: 'default' | 'primary' | 'accent';
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'primary'
          ? styles.buttonPrimary
          : variant === 'accent'
            ? styles.buttonAccent
            : styles.buttonDefault,
        pressed ? styles.buttonPressed : null,
      ]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{label}</Text>
      {subtitle ? <Text style={styles.buttonSubtext}>{subtitle}</Text> : null}
    </Pressable>
  );
}
