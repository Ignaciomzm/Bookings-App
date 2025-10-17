import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { formatDuration } from '../utils/dateFormatters';

/**
 * ServiceDropdown Component
 * Reusable dropdown for selecting services
 *
 * @param {Array} services - Array of service objects with {id, name, duration_min}
 * @param {string} selectedId - Currently selected service ID
 * @param {Function} onSelect - Callback when service is selected (serviceId, durationMin)
 * @param {string} placeholder - Placeholder text when no service selected
 */
export default function ServiceDropdown({ services, selectedId, onSelect, placeholder = 'Select a service' }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedService = services.find(s => s.id === selectedId);

  const handleSelect = (service) => {
    onSelect(service.id, service.duration_min);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.button}
        onPress={() => setIsOpen(!isOpen)}
      >
        <View style={styles.buttonContent}>
          <View style={{ flex: 1 }}>
            {selectedService ? (
              <View>
                <Text style={styles.selectedName}>{selectedService.name}</Text>
                <Text style={styles.selectedDuration}>{formatDuration(selectedService.duration_min)}</Text>
              </View>
            ) : (
              <Text style={styles.placeholder}>{placeholder}</Text>
            )}
          </View>
          <Text style={styles.arrow}>{isOpen ? '▲' : '▼'}</Text>
        </View>
      </Pressable>

      {isOpen && (
        <ScrollView style={styles.list} nestedScrollEnabled={true}>
          {services.map((service) => {
            const isSelected = service.id === selectedId;

            return (
              <Pressable
                key={service.id}
                style={[styles.item, isSelected && styles.itemSelected]}
                onPress={() => handleSelect(service)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
                    {service.name}
                  </Text>
                  <Text style={[styles.itemDuration, isSelected && styles.itemDurationSelected]}>
                    {formatDuration(service.duration_min)}
                  </Text>
                </View>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10000,
    marginBottom: 8,
  },
  button: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#fff',
    minHeight: 56,
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  selectedDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  placeholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  arrow: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  list: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 300,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 10001,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemSelected: {
    backgroundColor: '#F0FDF4',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  itemNameSelected: {
    color: '#10B981',
  },
  itemDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemDurationSelected: {
    color: '#059669',
  },
  checkmark: {
    fontSize: 20,
    color: '#10B981',
    marginLeft: 8,
  },
});
