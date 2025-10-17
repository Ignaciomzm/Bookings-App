import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * DateNavigator Component
 * Reusable component for navigating between dates with prev/next buttons
 *
 * @param {Date} date - Current date
 * @param {Function} onPrevious - Callback when previous button is pressed
 * @param {Function} onNext - Callback when next button is pressed
 * @param {string} dateFormat - Date format options for toLocaleDateString
 * @param {string} locale - Locale for date formatting ('pl-PL', 'en-US', etc.)
 * @param {boolean} isToday - Whether the current date is today
 */
export default function DateNavigator({
  date,
  onPrevious,
  onNext,
  dateFormat = { weekday: 'long', month: 'long', day: 'numeric' },
  locale = 'en-US',
  isToday = false
}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPrevious}
        style={styles.navButton}
      >
        <Ionicons name="chevron-back" size={24} color="#1F2937" />
      </TouchableOpacity>

      <View style={styles.dateDisplay}>
        <Text style={[styles.dateText, isToday && styles.dateTextToday]}>
          {date.toLocaleDateString(locale, dateFormat)}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onNext}
        style={styles.navButton}
      >
        <Ionicons name="chevron-forward" size={24} color="#1F2937" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  dateTextToday: {
    color: '#10B981',
  },
});
