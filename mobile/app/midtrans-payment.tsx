import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useDarkMode } from '../src/context/DarkModeContext';

export default function MidtransPaymentScreen() {
  const { url, order_id } = useLocalSearchParams();
  const router = useRouter();
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(true);

  if (!url) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#111827' : '#f9fafb' }]}>
        <View style={styles.errorContainer}>
          <Text style={{ color: darkMode ? '#fff' : '#111827' }}>URL Pembayaran tidak ditemukan.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={{ color: '#6366f1' }}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleNavigationStateChange = (navState: any) => {
    const { url: currentUrl } = navState;
    console.log('Current URL:', currentUrl);

    // Deteksi jika diarahkan ke halaman status atau kembali ke merchant
    // Kita tangkap sebelum ngrok sempat menampilkan warning lagi
    const isSuccess = currentUrl.includes('payment-status') || currentUrl.includes('finish') || currentUrl.includes('settlement');
    const isError = currentUrl.includes('error') || currentUrl.includes('failed') || currentUrl.includes('unfinish');
    const isCancel = currentUrl.includes('cancel');

    if (isSuccess || isError || isCancel) {
      // Langsung tutup WebView dan arahkan ke layar native Status
      router.replace({
        pathname: '/payment-status',
        params: { 
          order_id: order_id || 'unknown',
          transaction_status: isSuccess ? 'settlement' : (isCancel ? 'cancel' : 'failure')
        }
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#111827' : '#f9fafb' }]}>
      <View style={[styles.header, { borderBottomColor: darkMode ? '#374151' : '#e5e7eb' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={darkMode ? '#fff' : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: darkMode ? '#fff' : '#111827' }]}>Pembayaran Aman</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.webviewContainer}>
        <WebView
          source={{ 
            uri: url as string,
            headers: {
              'ngrok-skip-browser-warning': 'true'
            }
          }}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          style={{ flex: 1 }}
        />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  webviewContainer: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    marginTop: 20,
    padding: 10,
  }
});
