import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

/**
 * StaffSelector Component
 * Reusable component for selecting staff members with color-coded chips
 *
 * @param {Array} staff - Array of staff objects with {id, name, color}
 * @param {string} selectedId - Currently selected staff ID
 * @param {Function} onSelect - Callback when staff is selected (staffId)
 * @param {string} emptyMessage - Message to show when no staff available
 */
export default function StaffSelector({ staff, selectedId, onSelect, emptyMessage = 'No staff found' }) {
  return (
    <View style={styles.container}>
      {staff.length === 0 && <Text style={styles.emptyMessage}>{emptyMessage}</Text>}
      {staff.map((s) => (
        <Pressable
          key={s.id}
          onPress={() => onSelect(s.id)}
          style={[
            styles.chip,
            {
              borderColor: selectedId === s.id ? (s.color || '#1d342e') : '#E5E7EB',
              backgroundColor: selectedId === s.id ? `${s.color || '#1d342e'}18` : '#fff',
            },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: s.color || '#1d342e' }]} />
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.name, selectedId === s.id && { color: s.color || '#1d342e' }]}
              numberOfLines={1}
            >
              {s.name}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});
