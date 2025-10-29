import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Card({ title, children, style, titleStyle }) {
  return (
    <View style={[styles.container, style]}>
      {title ? <Text style={[styles.title, titleStyle]}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ac8c62',
  },
  title: {
    fontWeight: '900',
    marginBottom: 8,
    color: '#111827',
    fontSize: 18,
  },
});