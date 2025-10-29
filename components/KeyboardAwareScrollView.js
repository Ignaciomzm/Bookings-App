import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

const DEFAULT_PADDING_BOTTOM = 300;

export default function KeyboardAwareScrollView({
  children,
  style,
  contentContainerStyle,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 160 : 100,
  ...props
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={[{ flex: 1 }, style]}
      keyboardVerticalOffset={keyboardVerticalOffset}
      enabled
    >
      <ScrollView
        contentContainerStyle={[{ paddingBottom: DEFAULT_PADDING_BOTTOM }, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : 'never'}
        scrollEventThrottle={16}
        keyboardDismissMode="interactive"
        {...props}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}