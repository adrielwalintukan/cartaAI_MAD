import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDarkMode } from '../context/DarkModeContext';
import { useRouter } from 'expo-router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const weddingTemplates: Record<string, { id: number; title: string; description: string; image: any }[]> = {
  elegan: [
    { id: 1, title: 'Elegan Tradisional', description: 'Nuansa mewah dengan motif etnik dan warna keemasan.', image: require('../../assets/templates/elegan_1.png') },
    { id: 2, title: 'Elegan Minimalis', description: 'Tampilan lembut dengan dominasi putih dan dekorasi sederhana.', image: require('../../assets/templates/elegan_2.png') },
    { id: 7, title: 'Elegan Mewah', description: 'Latar hitam berkelas dengan aksen emas yang glamor.', image: require('../../assets/templates/elegan_3.png') },
  ],
  formal: [
    { id: 3, title: 'Formal Klasik', description: 'Ornamen detail dengan nuansa resmi dan berwibawa.', image: require('../../assets/templates/formal_1.png') },
    { id: 4, title: 'Formal Modern', description: 'Tampilan sederhana, bersih, namun tetap formal.', image: require('../../assets/templates/formal_2.png') },
    { id: 9, title: 'Formal Natural', description: 'Nuansa lembut dengan sentuhan alam yang tetap anggun.', image: require('../../assets/templates/formal_3.png') },
  ],
  simple: [
    { id: 10, title: 'Simple Clean', description: 'Desain putih bersih dengan tata letak rapi dan elegan.', image: require('../../assets/templates/simple_1.png') },
    { id: 11, title: 'Simple Bold', description: 'Dominasi warna kuat dengan kontras tinggi yang berani.', image: require('../../assets/templates/simple_2.png') },
    { id: 12, title: 'Simple Garis & Bunga', description: 'Desain hitam-putih dengan ilustrasi garis dan motif bunga.', image: require('../../assets/templates/simple_3.png') },
  ],
};

const categoryLabel: Record<string, string> = {
  elegan: 'Elegan',
  formal: 'Formal',
  simple: 'Simple',
};

export default function TemplateScreen() {
  const { darkMode } = useDarkMode();
  const router = useRouter();

  const bg = darkMode ? '#111827' : '#f9fafb';
  const cardBg = darkMode ? '#1f2937' : '#ffffff';
  const borderColor = darkMode ? '#374151' : '#f3f4f6';
  const textPrimary = darkMode ? '#ffffff' : '#111827';
  const textSecondary = darkMode ? '#d1d5db' : '#4b5563';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Navbar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 92 }}
      >
        {/* ── Header ────────────────────────────────── */}
        <LinearGradient
          colors={darkMode ? ['#111827', '#1f2937'] : ['#f9fafb', '#ffffff']}
          style={styles.headerSection}
        >
          <Text style={[styles.pageTitle, { color: textPrimary }]}>
            Template Undangan{' '}
            <Text style={styles.titleAccent}>Pernikahan</Text>
          </Text>

          {/* Dekorator garis */}
          <View style={styles.dividerWrap}>
            <LinearGradient
              colors={['#6366f1', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dividerLine}
            />
            <View style={[styles.dividerDot, { backgroundColor: darkMode ? '#1f2937' : '#f9fafb' }]} />
          </View>

          <Text style={[styles.pageSubtitle, { color: textSecondary }]}>
            Pilih template undangan pernikahan dengan berbagai gaya yang sesuai dengan selera Anda.
          </Text>
        </LinearGradient>

        {/* ── Semua Kategori ────────────────────────── */}
        <View style={[styles.content, { backgroundColor: bg }]}>
          {Object.entries(weddingTemplates).map(([style, templates]) => (
            <View key={style} style={styles.categorySection}>
              {/* Judul kategori */}
              <Text style={[styles.categoryTitle, { color: textPrimary }]}>
                {categoryLabel[style]}
              </Text>

              {/* Grid kartu */}
              <View style={styles.grid}>
                {templates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.card,
                      {
                        backgroundColor: cardBg,
                        borderColor,
                        shadowColor: darkMode ? '#000' : '#6366f1',
                      },
                    ]}
                    onPress={() => router.push(`/template-usage/${template.id}`)}
                    activeOpacity={0.88}
                  >
                    {/* Top accent bar */}
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.cardAccent}
                    />

                    {/* Gambar preview */}
                    <View style={[styles.imageWrap, { backgroundColor: darkMode ? '#374151' : '#f9fafb' }]}>
                      <Image
                        source={template.image}
                        style={styles.cardImage}
                        resizeMode="contain"
                      />
                    </View>

                    {/* Info */}
                    <View style={styles.cardBody}>
                      <Text style={[styles.cardTitle, { color: textPrimary }]}>
                        {template.title}
                      </Text>
                      <Text style={[styles.cardDesc, { color: textSecondary }]}>
                        {template.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Header ── */
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 16,
  },
  titleAccent: {
    color: '#6366f1',
  },
  dividerWrap: {
    width: 112,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  pageSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
  },

  /* ── Content ── */
  content: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  categorySection: {
    marginBottom: 40,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.3,
    textTransform: 'capitalize',
  },
  grid: {
    gap: 16,
  },

  /* ── Card ── */
  card: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardAccent: {
    height: 4,
  },
  imageWrap: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardBody: {
    padding: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 22,
  },
});
