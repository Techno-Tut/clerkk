import React from 'react';
import {View, TextInput, Text, StyleSheet, TextInputProps} from 'react-native';

interface CurrencyInputProps extends TextInputProps {
  prefix?: string;
  suffix?: string;
}

export default function CurrencyInput({
  prefix,
  suffix,
  style,
  ...props
}: CurrencyInputProps) {
  return (
    <View style={styles.container}>
      {prefix && <Text style={styles.prefix}>{prefix}</Text>}
      <TextInput
        style={[styles.input, style]}
        keyboardType="decimal-pad"
        placeholderTextColor="#999"
        {...props}
      />
      {suffix && <Text style={styles.suffix}>{suffix}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 16,
  },
  prefix: {
    fontSize: 16,
    color: '#666',
    paddingLeft: 16,
  },
  suffix: {
    fontSize: 16,
    color: '#666',
    paddingRight: 16,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 16,
    fontSize: 16,
    color: '#000',
  },
});
