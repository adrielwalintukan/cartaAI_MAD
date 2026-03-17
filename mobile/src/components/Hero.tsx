import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';

export default function Hero() {
  const router = useRouter();
  const { session, userProfile } = useAuth();
  const { darkMode } = useDarkMode();

  const handlePrimaryAction = () => {
    if (!session) {
      router.push('/login');
      return;
    }
    if (userProfile?.subscription_status === 'premium') {
      router.push('/(tabs)/generator');
    } else {
      router.push('/(tabs)/generator');
    }
  };

  const primaryLabel =
    userProfile?.subscription_status === 'premium'
      ? 'Buat Undangan Sekarang'
      : 'Coba Gratis';

  return (
    <LinearGradient
      colors={darkMode ? ['#111827', '#1f2937'] : ['#f9fafb', '#ffffff']}
      style={styles.section}
    >
      {/* Gambar Hero */}
      <View style={styles.imageWrapper}>
        <ImageBackground
          source={require('../../assets/templates/bg_hero1.png')}
          style={styles.imageCard}
          imageStyle={styles.image}
          resizeMode="cover"
        >
          {/* Overlay semi-transparan atas */}
          <View style={styles.imageOverlay} />
          {/* Gradient overlay bawah agar menyatu dengan latar */}
          <LinearGradient
            colors={['transparent', darkMode ? 'rgba(17,24,39,0.45)' : 'rgba(249,250,251,0.45)']}
            style={styles.imageFade}
          />
        </ImageBackground>
      </View>

      {/* Konten Teks */}
      <View style={styles.textBlock}>
        {/* Judul */}
        <Text style={[styles.title, { color: darkMode ? '#ffffff' : '#111827' }]}>
          Buat Undangan{' '}
          <Text style={styles.titleHighlight}>Pernikahan</Text>
          {' '}Digital yang Indah dan Praktis, Dirancang Otomatis oleh AI.
        </Text>

        {/* Deskripsi */}
        <Text style={[styles.subtitle, { color: darkMode ? '#d1d5db' : '#4b5563' }]}>
          Buat undangan pernikahan kamu yang kreatif dan personal dengan mudah.
          Tanpa ribet, cepat, dan hasilnya memukau!
        </Text>

        {/* Tombol CTA */}
        <View style={styles.actions}>
          {/* Tombol Utama */}
          <TouchableOpacity
            style={styles.primaryWrap}
            onPress={handlePrimaryAction}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryText}>{primaryLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Tombol Sekunder */}
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                borderColor: darkMode ? '#818cf8' : '#4f46e5',
                backgroundColor: darkMode ? 'rgba(99,102,241,0.08)' : 'transparent',
              },
            ]}
            onPress={() => router.push('/template')}
            activeOpacity={0.88}
          >
            <Text
              style={[
                styles.secondaryText,
                { color: darkMode ? '#818cf8' : '#4f46e5' },
              ]}
            >
              Lihat Contoh Undangan
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
    gap: 28,
  },
  imageWrapper: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    borderRadius: 22,
  },
  imageCard: {
    height: 300,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  image: {
    borderRadius: 22,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  imageFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  textBlock: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 32,
    lineHeight: 42,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleHighlight: {
    fontSize: 32,
    lineHeight: 42,
    fontWeight: '900',
    color: '#6366f1',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 340,
  },
  actions: {
    width: '100%',
    gap: 14,
    marginTop: 8,
  },
  primaryWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
