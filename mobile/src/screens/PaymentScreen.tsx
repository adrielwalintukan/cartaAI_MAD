import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDarkMode } from '../context/DarkModeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../lib/api';

export default function PaymentScreen() {
  const { darkMode } = useDarkMode();
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePayment = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      Alert.alert('Error', 'Silakan lengkapi informasi pribadi');
      return;
    }

    if (!session?.access_token) {
      Alert.alert('Login Diperlukan', 'Silakan login terlebih dahulu untuk melakukan pembayaran.');
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/create-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ plan: 'premium_monthly' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Gagal membuat transaksi.');
      }

      if (data.redirect_url) {
        // Buka Midtrans Snap di WebBrowser
        const result = await WebBrowser.openBrowserAsync(data.redirect_url);
        
        // Setelah browser ditutup, kita bisa arahkan ke status (meskipun webhook yang akan update DB)
        // User mungkin perlu cek history atau reload profile
        router.push({
          pathname: '/payment-status',
          params: { order_id: data.order_id || 'new_transaction' }
        });
      } else {
        throw new Error('URL pembayaran tidak ditemukan.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Terjadi kesalahan saat memproses pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  const PaymentOption = ({ value, icon, label, color }: any) => (
    <TouchableOpacity
      style={[
        styles.optionCard,
        { backgroundColor: darkMode ? '#1f2937' : '#fff', borderColor: paymentMethod === value ? color : (darkMode ? '#374151' : '#e5e7eb') },
        paymentMethod === value && { borderWidth: 2 }
      ]}
      onPress={() => setPaymentMethod(value)}
    >
      <MaterialIcons name={icon} size={24} color={paymentMethod === value ? color : '#9ca3af'} />
      <Text style={[styles.optionLabel, { color: paymentMethod === value ? color : (darkMode ? '#fff' : '#111827') }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#111827' : '#f9fafb' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: darkMode ? '#fff' : '#111827' }]}>
            Pembayaran <Text style={styles.brand}>Premium</Text>
          </Text>
        </View>

        {/* Order Summary */}
        <View style={[styles.summaryCard, { backgroundColor: darkMode ? '#1f2937' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: darkMode ? '#fff' : '#111827' }]}>Ringkasan Pesanan</Text>
          
          <View style={styles.summaryRow}>
            <View>
              <Text style={[styles.summaryItemText, { color: darkMode ? '#fff' : '#111827' }]}>Paket Premium</Text>
              <Text style={styles.summarySubtext}>Akses penuh semua fitur</Text>
            </View>
            <Text style={styles.summaryPrice}>Rp 99.000</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryItemText, { color: darkMode ? '#fff' : '#111827' }]}>Durasi</Text>
            <Text style={styles.summarySubtext}>1 Bulan</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: darkMode ? '#374151' : '#e5e7eb' }]}>
            <Text style={[styles.totalText, { color: darkMode ? '#fff' : '#111827' }]}>Total</Text>
            <Text style={styles.totalPrice}>Rp 99.000</Text>
          </View>
        </View>

        {/* Payment Form */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: darkMode ? '#fff' : '#111827' }]}>Informasi Pribadi</Text>
          
          <TextInput
            style={[styles.input, { backgroundColor: darkMode ? '#1f2937' : '#fff', color: darkMode ? '#fff' : '#111827', borderColor: darkMode ? '#374151' : '#d1d5db' }]}
            placeholder="Nama Lengkap"
            placeholderTextColor="#9ca3af"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />
          <TextInput
            style={[styles.input, { backgroundColor: darkMode ? '#1f2937' : '#fff', color: darkMode ? '#fff' : '#111827', borderColor: darkMode ? '#374151' : '#d1d5db' }]}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
          />
          <TextInput
            style={[styles.input, { backgroundColor: darkMode ? '#1f2937' : '#fff', color: darkMode ? '#fff' : '#111827', borderColor: darkMode ? '#374151' : '#d1d5db' }]}
            placeholder="Nomor Telepon"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(text) => handleInputChange('phone', text)}
          />

          <Text style={[styles.sectionTitle, { color: darkMode ? '#fff' : '#111827', marginTop: 16 }]}>Metode Pembayaran</Text>
          <View style={styles.optionsContainer}>
            <PaymentOption value="credit_card" icon="credit-card" label="Kartu Kredit" color="#6366f1" />
            <PaymentOption value="bank_transfer" icon="account-balance" label="Transfer Bank" color="#6366f1" />
            <PaymentOption value="e_wallet" icon="account-balance-wallet" label="E-Wallet" color="#6366f1" />
          </View>

          {paymentMethod === 'credit_card' && (
            <View style={styles.subForm}>
              <TextInput
                style={[styles.input, { backgroundColor: darkMode ? '#1f2937' : '#fff', color: darkMode ? '#fff' : '#111827', borderColor: darkMode ? '#374151' : '#d1d5db' }]}
                placeholder="Nomor Kartu"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                value={formData.cardNumber}
                onChangeText={(text) => handleInputChange('cardNumber', text)}
              />
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput, { backgroundColor: darkMode ? '#1f2937' : '#fff', color: darkMode ? '#fff' : '#111827', borderColor: darkMode ? '#374151' : '#d1d5db' }]}
                  placeholder="MM/YY"
                  placeholderTextColor="#9ca3af"
                  value={formData.expiryDate}
                  onChangeText={(text) => handleInputChange('expiryDate', text)}
                />
                <TextInput
                  style={[styles.input, styles.halfInput, { backgroundColor: darkMode ? '#1f2937' : '#fff', color: darkMode ? '#fff' : '#111827', borderColor: darkMode ? '#374151' : '#d1d5db' }]}
                  placeholder="CVV"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  value={formData.cvv}
                  onChangeText={(text) => handleInputChange('cvv', text)}
                  secureTextEntry
                />
              </View>
            </View>
          )}

          {paymentMethod === 'bank_transfer' && (
            <View style={[styles.infoBox, { backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.1)' : '#e0e7ff' }]}>
              <Text style={{ color: darkMode ? '#c7d2fe' : '#3730a3', marginBottom: 4 }}>Bank BCA</Text>
              <Text style={{ color: darkMode ? '#fff' : '#111827', fontSize: 18, fontWeight: 'bold' }}>1234 5678 90</Text>
              <Text style={{ color: darkMode ? '#c7d2fe' : '#3730a3', marginTop: 4 }}>a.n PT CartaAI Indonesia</Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.payButtonContainer}
            onPress={handlePayment}
          >
            <LinearGradient colors={['#6366f1', '#a855f7']} style={[styles.payButton, loading && { opacity: 0.7 }]}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.payButtonText}>Bayar Sekarang - Rp 99.000</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  brand: {
    color: '#6366f1',
  },
  summaryCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  summarySubtext: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  summaryPrice: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginBottom: 0,
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalPrice: {
    color: '#6366f1',
    fontSize: 24,
    fontWeight: 'bold',
  },
  formSection: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  subForm: {
    marginTop: 8,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  payButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
  },
  payButton: {
    padding: 18,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
