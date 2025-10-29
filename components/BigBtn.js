import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

export default function BigBtn({ text, onPress, kind = 'default', style }) {
  const backgroundColor = kind === 'danger' ? '#B91C1C' : '#1d342e';

  return (
    <Pressable onPress={onPress} style={[styles.button, { backgroundColor }, style]}>
      <Text style={styles.label} numberOfLines={1}>
        {text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  label: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
});