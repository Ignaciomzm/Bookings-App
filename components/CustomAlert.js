import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ICON_MAP = {
  success: { iconName: 'checkmark-circle', color: '#10B981', bgColor: '#ECFDF5' },
  error: { iconName: 'close-circle', color: '#EF4444', bgColor: '#FEF2F2' },
  warning: { iconName: 'warning', color: '#F59E0B', bgColor: '#FFFBEB' },
  confirm: { iconName: 'help-circle', color: '#1d342e', bgColor: '#EEF2FF' },
  info: { iconName: 'information-circle', color: '#3B82F6', bgColor: '#EFF6FF' },
};

export default function CustomAlert({
  visible,
  title,
  message,
  type = 'info',
  buttons = [],
  onClose,
}) {
  const iconConfig = ICON_MAP[type] || ICON_MAP.info;

  if (!visible) return null;

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleButtonPress = (button) => {
    if (button?.onPress) {
      button.onPress();
    }
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconWrapper, { backgroundColor: iconConfig.bgColor }]}>
            <Ionicons
              name={iconConfig.iconName}
              size={32}
              color={iconConfig.color}
              style={styles.icon}
            />
          </View>

          <Text style={styles.title}>{title}</Text>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.buttonRow}>
            {buttons.length > 0
              ? buttons.map((button, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.button,
                      button.style === 'cancel' && styles.buttonCancel,
                      button.style === 'destructive' && styles.buttonDestructive,
                      index > 0 && styles.buttonSpacing,
                    ]}
                    onPress={() => handleButtonPress(button)}
                  >
                    <Text
                      style={[
                        styles.buttonLabel,
                        button.style === 'cancel' && styles.buttonLabelCancel,
                        button.style === 'destructive' && styles.buttonLabelDestructive,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </Pressable>
                ))
              : (
                <Pressable style={styles.button} onPress={handleClose}>
                  <Text style={styles.buttonLabel}>OK</Text>
                </Pressable>
                )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    width: '90%',
    maxWidth: 400,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 32,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#c7a864',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 100,
  },
  buttonSpacing: {
    marginLeft: 12,
  },
  buttonCancel: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonDestructive: {
    backgroundColor: '#EF4444',
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonLabelCancel: {
    color: '#6B7280',
  },
  buttonLabelDestructive: {
    color: '#fff',
  },
});