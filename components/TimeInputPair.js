import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { validateHour, validateMinute } from '../utils/timeValidation';

/**
 * TimeInputPair Component
 * Reusable component for hour and minute input with validation
 *
 * @param {string} hourValue - Current hour value (00-23)
 * @param {string} minuteValue - Current minute value (00-59)
 * @param {Function} onHourChange - Callback when hour changes
 * @param {Function} onMinuteChange - Callback when minute changes
 * @param {string} hourPlaceholder - Placeholder for hour input
 * @param {string} minutePlaceholder - Placeholder for minute input
 */
export default function TimeInputPair({
  hourValue,
  minuteValue,
  onHourChange,
  onMinuteChange,
  hourPlaceholder = '10',
  minutePlaceholder = '30'
}) {
  const handleHourBlur = () => {
    const validated = validateHour(hourValue, hourPlaceholder);
    if (validated !== hourValue) {
      onHourChange(validated);
    }
  };

  const handleMinuteBlur = () => {
    const validated = validateMinute(minuteValue, minutePlaceholder);
    if (validated !== minuteValue) {
      onMinuteChange(validated);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, styles.inputFocused]}
        value={hourValue}
        onChangeText={onHourChange}
        placeholder={hourPlaceholder}
        placeholderTextColor="#9CA3AF"
        keyboardType="number-pad"
        maxLength={2}
        onBlur={handleHourBlur}
      />
      <Text style={styles.separator}>:</Text>
      <TextInput
        style={[styles.input, styles.inputFocused]}
        value={minuteValue}
        onChangeText={onMinuteChange}
        placeholder={minutePlaceholder}
        placeholderTextColor="#9CA3AF"
        keyboardType="number-pad"
        maxLength={2}
        onBlur={handleMinuteBlur}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: 60,
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#fff',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
  },
  inputFocused: {
    borderColor: '#10B981',
  },
  separator: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 8,
  },
});
