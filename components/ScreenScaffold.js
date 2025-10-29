import React from 'react';
import { ActivityIndicator, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ScreenScaffold({
  title,
  subtitle,
  children,
  onOpenSettings,
  actionSlot,
  leftAction,
  isSyncing,
  showSettingsButton = true,
  showTitle = true,
  headerPaddingBottom = 42,
  styles,
}) {
  return (
    <SafeAreaView style={styles.screenRoot}>
      <View style={[styles.screenHeaderWrapper, { paddingBottom: headerPaddingBottom }]}> 
        <View style={styles.screenHeader}>
          <View style={styles.screenHeading}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {leftAction}
              {showTitle && title ? <Text style={styles.screenTitle}>{title}</Text> : null}
            </View>
            {showTitle && subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
          </View>
          <View style={styles.screenHeaderActions}>
            {isSyncing ? (
              <View style={styles.syncBadge}>
                <ActivityIndicator size="small" color="#1d342e" />
                <Text style={styles.syncBadgeText}>Syncing</Text>
              </View>
            ) : null}
            {actionSlot}
            {showSettingsButton ? (
              <TouchableOpacity
                onPress={onOpenSettings}
                style={styles.headerCircleButton}
                accessibilityRole="button"
                accessibilityLabel="Open settings"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="settings-outline" size={20} color="#0f172a" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
      <View style={styles.screenContent}>{children}</View>
    </SafeAreaView>
  );
}