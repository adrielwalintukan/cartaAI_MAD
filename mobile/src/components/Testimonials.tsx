import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useDarkMode } from '../context/DarkModeContext';

const testimonials = [
  {
    text: '"CartaAI membuat undangan pernikahan kami jadi lebih berkesan! Prosesnya cepat, hasilnya cantik."',
    name: 'Maya & Rio',
    role: 'Pasangan Pernikahan',
    image: require('../../assets/templates/simple_3.png'),
  },
  {
    text: '"Kami sangat puas dengan layanan CartaAI. Desain undangannya elegan dan sesuai dengan tema pernikahan kami!"',
    name: 'Budi & Sarah',
    role: 'Pasangan Pernikahan',
    image: require('../../assets/templates/logo_cartaAI.png'),
  },
  {
    text: '"Undangan pernikahan kami jadi unik dan berkesan berkat CartaAI. Prosesnya mudah dan hasilnya luar biasa indah!"',
    name: 'Arif',
    role: 'Mempelai laki-laki',
    image: require('../../assets/templates/logo_cartaAI.png'),
  },
];

export default function Testimonials() {
  const { darkMode } = useDarkMode();

  return (
    <LinearGradient
      colors={
        darkMode
          ? ['rgba(31,41,55,0.5)', 'rgba(17,24,39,0.5)']
          : ['rgba(238,242,255,0.35)', 'rgba(243,232,255,0.2)']
      }
      style={styles.section}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: darkMode ? '#fff' : '#111827' }]}>
          Apa Kata <Text style={styles.titleAccent}>Mereka?</Text>
        </Text>
        <Text style={[styles.subtitle, { color: darkMode ? '#9ca3af' : '#6b7280' }]}>
          Cerita sukses dari pengguna kami yang bahagia.
        </Text>
      </View>

      {/* Daftar Testimoni */}
      <View style={styles.list}>
        {testimonials.map((testimonial) => (
          <View
            key={testimonial.name}
            style={[
              styles.card,
              {
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                borderColor: darkMode ? '#374151' : '#f3f4f6',
                shadowColor: darkMode ? '#000' : '#6366f1',
              },
            ]}
          >
            {/* Top accent bar */}
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cardAccent}
            />

            {/* Ikon kutip */}
            <LinearGradient
              colors={['#6366f1', '#7c3aed']}
              style={styles.quoteWrap}
            >
              <MaterialIcons name="format-quote" size={20} color="#fff" />
            </LinearGradient>

            {/* Teks kutipan */}
            <Text style={[styles.quoteText, { color: darkMode ? '#d1d5db' : '#4b5563' }]}>
              {testimonial.text}
            </Text>

            {/* Baris penulis */}
            <View
              style={[
                styles.authorRow,
                { borderTopColor: darkMode ? '#374151' : '#f3f4f6' },
              ]}
            >
              {/* Avatar dengan border gradient */}
              <View style={styles.avatarOuter}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.avatarGradient}
                >
                  <Image source={testimonial.image} style={styles.avatar} />
                </LinearGradient>
              </View>
              <View>
                <Text style={[styles.authorName, { color: darkMode ? '#fff' : '#111827' }]}>
                  {testimonial.name}
                </Text>
                <Text style={[styles.authorRole, { color: darkMode ? '#9ca3af' : '#6b7280' }]}>
                  {testimonial.role}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  titleAccent: {
    color: '#6366f1',
  },
  subtitle: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 320,
  },
  list: {
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 22,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  quoteWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 25,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  authorRow: {
    borderTopWidth: 1,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1,
    padding: 2,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  authorRole: {
    marginTop: 3,
    fontSize: 12,
  },
});
