import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useDarkMode } from '../context/DarkModeContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';



const whyItems = [
  {
    icon: 'bolt' as const,
    title: '⚡ Cepat & Hemat',
    desc: 'Dari ide ke undangan siap kirim hanya dalam hitungan menit — tanpa biaya cetak berlebihan.',
  },
  {
    icon: 'brush' as const,
    title: '🎨 Desain Unik',
    desc: 'AI kami belajar dari ribuan desain premium untuk menghasilkan karya yang benar-benar orisinal.',
  },
  {
    icon: 'favorite' as const,
    title: '❤️ Personalisasi',
    desc: 'Setiap detail — dari font hingga ilustrasi — mencerminkan kepribadian dan kisah Anda.',
  },
];

const howItems = [
  { step: 1, icon: 'palette' as const, title: 'Pilih Tema', desc: 'Klasik, modern, rustic, atau custom sesuai selera.' },
  { step: 2, icon: 'text-fields' as const, title: 'Masukkan Detail', desc: 'Nama pasangan, tanggal, lokasi, dan pesan spesial.' },
  { step: 3, icon: 'auto-awesome' as const, title: 'AI Generate', desc: 'AI merancang undangan berdasarkan preferensi Anda.' },
  { step: 4, icon: 'share' as const, title: 'Bagikan', desc: 'Undangan digital siap dikirim atau dicetak.' },
];

const visionMission = [
  {
    title: 'Visi Kami',
    icon: 'visibility' as const,
    iconBg: '#4f46e5',
    desc: 'Menjadi solusi terdepan untuk undangan pernikahan digital yang menggabungkan keindahan desain, personalisasi mendalam, dan kecanggihan AI — tanpa kompromi pada makna.',
  },
  {
    title: 'Misi Kami',
    icon: 'flag' as const,
    iconBg: '#7c3aed',
    desc: 'Memberikan pengalaman pembuatan undangan dalam 3 menit, desain eksklusif (bukan template), dan pilihan digital/cetak premium yang ramah lingkungan.',
  },
];

export default function AboutScreen() {
  const { darkMode } = useDarkMode();

  const bg = darkMode ? '#111827' : '#f9fafb';
  const cardBg = darkMode ? '#1f2937' : '#ffffff';
  const borderColor = darkMode ? '#374151' : '#f3f4f6';
  const textPrimary = darkMode ? '#ffffff' : '#111827';
  const textSecondary = darkMode ? '#d1d5db' : '#4b5563';
  const textMuted = darkMode ? '#9ca3af' : '#6b7280';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Navbar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 92 }}
      >
        {/* ── Hero Banner ─────────────────────────────── */}
        <ImageBackground
          source={require('../../assets/templates/bg_hero1.png')}
          style={styles.heroBanner}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={StyleSheet.absoluteFillObject}
          />
        </ImageBackground>

        {/* ── Opening Statement ──────────────────────── */}
        <View style={[styles.section, { backgroundColor: bg }]}>
          {/* Dekorator garis */}
          <View style={styles.dividerWrap}>
            <LinearGradient
              colors={['#6366f1', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dividerLine}
            />
            <View style={[styles.dividerDot, { backgroundColor: bg }]} />
          </View>

          <Text style={[styles.openingText, { color: textSecondary }]}>
            <Text style={[styles.openingBrand, { color: darkMode ? '#818cf8' : '#4338ca' }]}>
              cartaAI{' '}
            </Text>
            hadir untuk membantu pasangan calon pengantin menciptakan undangan pernikahan yang
            personal, elegan, dan unik — dengan kekuatan AI yang dipadukan dengan sentuhan manusiawi.
            Kami percaya:{' '}
            <Text style={styles.openingItalic}>
              setiap kisah cinta layak diabadikan dalam undangan yang tak terlupakan.
            </Text>
          </Text>
        </View>

        {/* ── Visi & Misi ───────────────────────────── */}
        <View style={[styles.section, { backgroundColor: bg }]}>
          {visionMission.map((item, i) => (
            <View key={i} style={styles.vmCardWrap}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.vmBorder}
              >
                <View style={[styles.vmCard, { backgroundColor: cardBg }]}>
                  <LinearGradient colors={['#667eea', '#764ba2']} style={styles.vmAccent} />
                  <View style={[styles.vmIconWrap, { backgroundColor: item.iconBg }]}>
                    <MaterialIcons name={item.icon} size={24} color="#fff" />
                  </View>
                  <View style={styles.vmTitleRow}>
                    <Text style={[styles.vmTitle, { color: textPrimary }]}>{item.title}</Text>
                    <View style={styles.vmTitleLine} />
                  </View>
                  <Text style={[styles.vmDesc, { color: textSecondary }]}>{item.desc}</Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* ── Mengapa cartaAI ───────────────────────── */}
        <LinearGradient
          colors={darkMode ? ['#111827', '#111827'] : ['rgba(238,242,255,0.4)', 'rgba(243,232,255,0.2)']}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>
              Mengapa <Text style={styles.accent}>cartaAI</Text>
            </Text>
            <Text style={[styles.sectionSubtitle, { color: textMuted }]}>
              Kami bukan hanya alat — kami mitra dalam merayakan kisah cinta Anda.
            </Text>
          </View>

          <View style={styles.cardList}>
            {whyItems.map((item, i) => (
              <View
                key={i}
                style={[styles.whyCard, { backgroundColor: cardBg, borderColor, shadowColor: darkMode ? '#000' : '#6366f1' }]}
              >
                <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardAccent} />
                <LinearGradient colors={['#6366f1', '#7c3aed']} style={styles.whyIconWrap}>
                  <MaterialIcons name={item.icon} size={22} color="#fff" />
                </LinearGradient>
                <Text style={[styles.whyTitle, { color: textPrimary }]}>{item.title}</Text>
                <Text style={[styles.whyDesc, { color: textSecondary }]}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── Cara Kerja ────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: bg }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>
              Cara Kerja <Text style={styles.accent}>cartaAI</Text>
            </Text>
            <Text style={[styles.sectionSubtitle, { color: textMuted }]}>
              Sederhana, cepat, dan penuh kejutan indah.
            </Text>
          </View>

          <View style={styles.howGrid}>
            {howItems.map((item, i) => (
              <View key={i} style={styles.howItem}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.howIconWrap}
                >
                  <MaterialIcons name={item.icon} size={24} color="#fff" />
                </LinearGradient>
                <Text style={[styles.howTitle, { color: textPrimary }]}>{item.title}</Text>
                <Text style={[styles.howDesc, { color: textMuted }]}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Hero ── */
  heroBanner: {
    height: 220,
    justifyContent: 'flex-end',
  },

  /* ── Sections ── */
  section: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  accent: {
    color: '#6366f1',
  },

  /* ── Opening ── */
  dividerWrap: {
    alignSelf: 'center',
    width: 112,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  dividerLine: {
    width: '100%',
    height: 4,
    borderRadius: 999,
  },
  dividerDot: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: '#6366f1',
  },
  openingText: {
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'center',
  },
  openingBrand: {
    fontWeight: '700',
  },
  openingItalic: {
    fontStyle: 'italic',
  },

  /* ── Visi Misi ── */
  vmCardWrap: {
    marginBottom: 18,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  vmBorder: {
    borderRadius: 22,
    padding: 3,
  },
  vmCard: {
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
  },
  vmAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  vmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  vmTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  vmTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  vmTitleLine: {
    flex: 1,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#667eea',
    maxWidth: 32,
  },
  vmDesc: {
    fontSize: 15,
    lineHeight: 24,
  },

  /* ── Why ── */
  cardList: {
    gap: 16,
  },
  whyCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
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
  whyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  whyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  whyDesc: {
    fontSize: 14,
    lineHeight: 22,
  },

  /* ── How It Works ── */
  howGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'space-between',
  },
  howItem: {
    width: '45%',
    alignItems: 'center',
  },
  howIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  howTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  howDesc: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 140,
  },

  /* ── Tim ── */
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
  },
  memberItem: {
    alignItems: 'center',
    width: 100,
  },
  memberAvatarBorder: {
    width: 92,
    height: 92,
    borderRadius: 20,
    padding: 3,
    marginBottom: 10,
  },
  memberAvatarInner: {
    flex: 1,
    borderRadius: 17,
    overflow: 'hidden',
  },
  memberAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },

  /* ── Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 14,
  },
  modalAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  modalClose: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
  },
  modalContent: {
    alignItems: 'center',
    marginTop: 8,
  },
  modalAvatarBorder: {
    width: 160,
    height: 160,
    borderRadius: 24,
    padding: 3,
    marginBottom: 20,
  },
  modalAvatarInner: {
    flex: 1,
    borderRadius: 21,
    overflow: 'hidden',
  },
  modalAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
  },
  modalName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  modalRole: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 16,
  },
  modalBio: {
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
