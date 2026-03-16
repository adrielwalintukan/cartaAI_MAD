import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { API_BASE_URL } from '../lib/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Alert } from 'react-native';

const pricingPlans = [
  {
    id: 'free',
    name: 'Basic',
    price: 'Gratis',
    description: 'Untuk memulai',
    buttonText: 'Mulai Gratis',
    isPopular: false,
    features: ['Desain terbatas', 'Fitur dasar', 'Hingga 100 undangan'],
  },
  {
    id: 'premium_monthly',
    name: 'Premium',
    price: 'Rp 99rb',
    period: '/bulan',
    description: 'Untuk acara spesial',
    buttonText: 'Pilih Paket Premium',
    isPopular: true,
    features: [
      'Semua desain premium',
      'Fitur lengkap & interaktif',
      'Hingga 500 undangan',
      'Dukungan prioritas',
    ],
  },
];

export default function PricingScreen() {
  const { darkMode } = useDarkMode();
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const bg = darkMode ? '#111827' : '#f9fafb';
  const cardBg = darkMode ? '#1f2937' : '#ffffff';
  const textPrimary = darkMode ? '#ffffff' : '#111827';
  const textSecondary = darkMode ? '#d1d5db' : '#4b5563';
  const textMuted = darkMode ? '#9ca3af' : '#6b7280';

  const handleAction = async (plan: typeof pricingPlans[0]) => {
    if (!session?.access_token) {
      router.push('/login');
      return;
    }
    
    if (plan.id === 'free') {
      router.push('/chat');
      return;
    }

    setLoading(plan.id);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/create-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ plan: plan.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Gagal membuat transaksi.');
      }

      if (data.redirect_url) {
        // Navigasi ke layar WebView kita
        router.push({
          pathname: '/midtrans-payment' as any,
          params: { 
            url: data.redirect_url,
            order_id: data.order_id
          }
        });
      } else {
        throw new Error('URL pembayaran tidak ditemukan.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
      Alert.alert('Error', err.message || 'Terjadi kesalahan saat memproses pembayaran.');
    } finally {
      setLoading(null);
    }
  };

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

          <Text style={[styles.pageTitle, { color: textPrimary }]}>
            Fitur Paket yang{' '}
            <Text style={styles.titleAccent}>Tersedia</Text>
          </Text>
          <Text style={[styles.pageSubtitle, { color: textSecondary }]}>
            Pilih paket yang paling sesuai dengan kebutuhan Anda
          </Text>

          {!!error && (
            <Text style={styles.errorText}>Error: {error}</Text>
          )}
        </LinearGradient>

        {/* ── Kartu Paket ───────────────────────────── */}
        <View style={[styles.cardsSection, { backgroundColor: bg }]}>
          {pricingPlans.map((plan, index) => (
            <View key={index} style={styles.planWrapper}>
              {/* Gradient border */}
              <LinearGradient
                colors={
                  plan.isPopular
                    ? ['#667eea', '#764ba2']
                    : ['#e0e7ff', '#f3e8ff']
                }
                style={styles.planBorder}
              >
                <View style={[styles.planCard, { backgroundColor: cardBg }]}>
                  {/* Top accent bar */}
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.topAccent}
                  />

                  {/* Badge Populer */}
                  {plan.isPopular && (
                    <View style={styles.popularBadgeWrap}>
                      <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.popularBadge}
                      >
                        <Text style={styles.popularText}>Populer</Text>
                      </LinearGradient>
                    </View>
                  )}

                  {/* Nama & Harga */}
                  <Text style={[styles.planName, { color: textPrimary }]}>
                    {plan.name}
                  </Text>
                  <Text style={[styles.planPrice, { color: textPrimary }]}>
                    {plan.price}
                    {plan.period ? (
                      <Text style={[styles.planPeriod, { color: textMuted }]}>
                        {plan.period}
                      </Text>
                    ) : null}
                  </Text>
                  <Text style={[styles.planDesc, { color: textMuted }]}>
                    {plan.description}
                  </Text>

                  {/* Tombol aksi */}
                  <TouchableOpacity
                    onPress={() => handleAction(plan)}
                    disabled={!!loading}
                    style={styles.actionWrap}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.actionButton}
                    >
                      {loading === plan.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.actionText}>{plan.buttonText}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Daftar fitur */}
                  <View style={styles.featuresList}>
                    {plan.features.map((feature, fi) => (
                      <View key={fi} style={styles.featureRow}>
                        <MaterialIcons name="check-circle" size={20} color="#10b981" />
                        <Text style={[styles.featureText, { color: darkMode ? '#d1d5db' : '#374151' }]}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </LinearGradient>
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
  dividerWrap: {
    width: 112,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  titleAccent: {
    color: '#6366f1',
  },
  pageSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  errorText: {
    marginTop: 12,
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },

  /* ── Kartu ── */
  cardsSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 28,
  },
  planWrapper: {
    paddingTop: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  planBorder: {
    borderRadius: 22,
    padding: 4,
  },
  planCard: {
    borderRadius: 18,
    padding: 24,
    overflow: 'hidden',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  popularBadgeWrap: {
    alignItems: 'center',
    marginTop: -16,
    marginBottom: 12,
  },
  popularBadge: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  planName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  planPeriod: {
    fontSize: 17,
    fontWeight: '500',
  },
  planDesc: {
    fontSize: 14,
    marginBottom: 22,
  },
  actionWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  actionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  featuresList: {
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
