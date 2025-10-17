import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * ViewModeSelector Component
 * Reusable dropdown for switching between daily, weekly, and monthly calendar views
 *
 * @param {string} viewMode - Current view mode ('daily', 'weekly', 'monthly')
 * @param {Function} onViewModeChange - Callback when view mode changes
 * @param {Object} labels - Labels for each view mode {daily, weekly, monthly}
 */
export default function ViewModeSelector({ viewMode, onViewModeChange, labels }) {
  const [showMenu, setShowMenu] = useState(false);

  const getCurrentLabel = () => {
    if (viewMode === 'daily') return labels.daily;
    if (viewMode === 'weekly') return labels.weekly;
    return labels.monthly;
  };

  const handleSelect = (mode) => {
    onViewModeChange(mode);
    setShowMenu(false);
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.button}
        onPress={() => setShowMenu(!showMenu)}
      >
        <Ionicons name="menu" size={20} color="#1d342e" />
        <Text style={styles.buttonText}>{getCurrentLabel()}</Text>
        <Ionicons name={showMenu ? "chevron-up" : "chevron-down"} size={16} color="#666" />
      </Pressable>

      {showMenu && (
        <View style={styles.dropdown}>
          <Pressable
            style={[styles.option, viewMode === 'daily' && styles.optionActive]}
            onPress={() => handleSelect('daily')}
          >
            <Ionicons name="today" size={18} color={viewMode === 'daily' ? '#c7a864' : '#666'} />
            <Text style={[styles.optionText, viewMode === 'daily' && styles.optionTextActive]}>
              {labels.daily}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.option, viewMode === 'weekly' && styles.optionActive]}
            onPress={() => handleSelect('weekly')}
          >
            <Ionicons name="calendar" size={18} color={viewMode === 'weekly' ? '#c7a864' : '#666'} />
            <Text style={[styles.optionText, viewMode === 'weekly' && styles.optionTextActive]}>
              {labels.weekly}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.option, viewMode === 'monthly' && styles.optionActive]}
            onPress={() => handleSelect('monthly')}
          >
            <Ionicons name="calendar-outline" size={18} color={viewMode === 'monthly' ? '#c7a864' : '#666'} />
            <Text style={[styles.optionText, viewMode === 'monthly' && styles.optionTextActive]}>
              {labels.monthly}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d342e',
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionActive: {
    backgroundColor: '#FEF3C7',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  optionTextActive: {
    fontWeight: '700',
    color: '#c7a864',
  },
});
