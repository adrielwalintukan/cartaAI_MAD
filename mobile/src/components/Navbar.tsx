import React, { useMemo, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import Logo from './Logo';

export default function Navbar() {
  const insets = useSafeAreaInsets();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const router = useRouter();
  const { session } = useAuth();
  const theme = useMemo(
    () => ({
      text: darkMode ? '#f9fafb' : '#111827',
      secondary: darkMode ? '#d1d5db' : '#6b7280',
      panel: darkMode ? 'rgba(17,24,39,0.96)' : 'rgba(255,255,255,0.96)',
      border: darkMode ? 'rgba(55,65,81,0.65)' : 'rgba(229,231,235,0.85)',
      hover: darkMode ? 'rgba(31,41,55,0.95)' : '#f8fafc',
      active: '#4f46e5',
      freeBg: darkMode ? '#374151' : '#e5e7eb',
      freeText: darkMode ? '#f3f4f6' : '#1f2937',
    }),
    [darkMode]
  );

  const handleProfilePress = () => {
    if (session) {
      router.push('/(tabs)/profile');
    } else {
      router.push('/login');
    }
  };

  return (
    <View style={styles.wrapper}>
      <BlurView
        intensity={90}
        tint={darkMode ? 'dark' : 'light'}
        style={[
          styles.header,
          {
            backgroundColor: theme.panel,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={[styles.safeArea, { paddingTop: insets.top > 0 ? insets.top : Platform.OS === 'android' ? 30 : 0 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.brand}
              onPress={() => router.push('/')}
              activeOpacity={0.85}
            >
              <Logo size={46} showText={false} />
              <Text style={[styles.brandText, { color: theme.text }]}>cartaAI</Text>
            </TouchableOpacity>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={toggleDarkMode}
                style={[styles.iconButton, { backgroundColor: theme.hover }]}
                activeOpacity={0.85}
              >
                <MaterialIcons
                  name={darkMode ? 'light-mode' : 'dark-mode'}
                  size={22}
                  color={theme.secondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleProfilePress}
                style={[styles.iconButton, { backgroundColor: theme.hover }]}
                activeOpacity={0.85}
              >
                <MaterialIcons
                  name="person"
                  size={24}
                  color={theme.text}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 120,
  },
  header: {
    borderBottomWidth: 1,
  },
  safeArea: {
    // paddingTop is now handled dynamically using useSafeAreaInsets
  },
  headerRow: {
    height: 72,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuPanel: {
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  menuContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 24,
    gap: 0,
  },
  menuSection: {
    gap: 0,
  },
  linkButton: {
    paddingVertical: 14,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
  },
  linkTextActive: {
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginTop: 12,
    marginBottom: 16,
  },
  authGroup: {
    gap: 10,
  },
  ctaWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  ctaButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ctaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  freeButton: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  freeButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
