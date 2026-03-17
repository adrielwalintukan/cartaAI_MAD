import React from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';
import { useDarkMode } from '../context/DarkModeContext';

interface LogoProps {
  size?: number;
  style?: any;
  showText?: boolean;
}

export default function Logo({ size = 48, style, showText = true }: LogoProps) {
  const { darkMode } = useDarkMode();

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../assets/templates/logo_cartaAI.png')}
        style={{ width: size, height: size, borderRadius: size / 2, resizeMode: 'cover' }}
      />
      {showText && (
        <Text style={[
          styles.text, 
          { fontSize: size * 0.5, color: darkMode ? '#fff' : '#111827' }
        ]}>
          cartaAI
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
});
