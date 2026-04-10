import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import Navbar from '../components/Navbar';
import { API_BASE_URL } from '../lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GuestManagementModal from '../components/GuestManagementModal';

type ActiveTab = 'rsvps' | 'messages';

export default function ProfileScreen() {
  const { session, logout } = useAuth();
  const { darkMode } = useDarkMode();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [invitations, setInvitations] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, hadir: 0, tidak_hadir: 0, total_guests: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('rsvps');
  const [selectedInvitationFilter, setSelectedInvitationFilter] = useState('all');
  const [isInvitationDropdownOpen, setIsInvitationDropdownOpen] = useState(false);

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareSlug, setShareSlug] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invitationToDelete, setInvitationToDelete] = useState<string | null>(null);

  const theme = useMemo(
    () => ({
      bg: darkMode ? '#111827' : '#f9fafb',
      card: darkMode ? '#1f2937' : '#ffffff',
      soft: darkMode ? '#0f172a' : '#f8fafc',
      text: darkMode ? '#ffffff' : '#111827',
      secondary: darkMode ? '#d1d5db' : '#4b5563',
      muted: darkMode ? '#9ca3af' : '#6b7280',
      border: darkMode ? '#374151' : '#e5e7eb',
    }),
    [darkMode]
  );

  const filteredRsvps =
    selectedInvitationFilter === 'all'
      ? rsvps
      : rsvps.filter((item) => String(item.undangan_id) === selectedInvitationFilter);

  const dynamicStats =
    selectedInvitationFilter === 'all'
      ? stats
      : {
          total: filteredRsvps.length,
          hadir: filteredRsvps.filter(
            (item) => !String(item.kehadiran || '').toLowerCase().includes('tidak')
          ).length,
          tidak_hadir: filteredRsvps.filter((item) =>
            String(item.kehadiran || '').toLowerCase().includes('tidak')
          ).length,
          total_guests: 0, // This is removed since it's now handled by the modal internally
        };

  useFocusEffect(
    useCallback(() => {
      if (!session) {
        router.replace('/login');
        return;
      }
      fetchData();
    }, [session])
  );

  const fetchData = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      if (!API_BASE_URL) throw new Error('EXPO_PUBLIC_BACKEND_URL belum diset');
      const headers = { Authorization: `Bearer ${session.access_token}` };

      const invRes = await fetch(`${API_BASE_URL}/api/invitations/`, { headers });
      if (!invRes.ok) throw new Error('Gagal mengambil data undangan.');
      const invData = await invRes.json();
      setInvitations(
        invData.sort(
          (a: any, b: any) =>
            new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
        )
      );

      const rsvpRes = await fetch(`${API_BASE_URL}/api/invitations/all-rsvps`, { headers });
      if (rsvpRes.ok) {
        const rsvpData = await rsvpRes.json();
        setRsvps(rsvpData.messages || []);
        setStats(rsvpData.stats || { total: 0, hadir: 0, tidak_hadir: 0, total_guests: 0 });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat data profil.';
      setError(message);
      console.error('Fetch Profile Data Error:', { apiBaseUrl: API_BASE_URL, error: err });
    } finally {
      setLoading(false);
    }
  };

  const handleShareClick = (slug: string) => {
    setShareSlug(slug);
    setShareModalOpen(true);
  };

  const requestDeleteInvitation = (slug: string) => {
    setInvitationToDelete(slug);
    setDeleteModalOpen(true);
  };

  const confirmDeleteInvitation = async () => {
    if (!session?.access_token || !API_BASE_URL || !invitationToDelete) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/invitations/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ slugs: [invitationToDelete] }),
      });
      if (!response.ok) throw new Error('Gagal menghapus undangan.');
      setDeleteModalOpen(false);
      setInvitationToDelete(null);
      await fetchData();
    } catch {
      Alert.alert('Error', 'Gagal menghapus undangan.');
    }
  };

  const openInvitation = async (slug: string) => {
    if (!API_BASE_URL) return;
    await Linking.openURL(`${API_BASE_URL}/api/invitations/${slug}`);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const StatCard = ({
    title,
    value,
    icon,
    colors,
    accentColors,
  }: {
    title: string;
    value: number;
    icon: keyof typeof MaterialIcons.glyphMap;
    colors: [string, string];
    accentColors: [string, string];
  }) => (
    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Top accent bar */}
      <LinearGradient
        colors={accentColors as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.statAccent}
      />
      <View style={[styles.statIcon, { backgroundColor: darkMode ? '#0f172a' : colors[0] }]}>
        <MaterialIcons name={icon} size={20} color={colors[1]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.statTitle, { color: theme.muted }]}>{title}</Text>
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );

  const TabButton = ({
    label,
    value,
    icon,
  }: {
    label: string;
    value: ActiveTab;
    icon: keyof typeof MaterialIcons.glyphMap;
  }) => {
    const active = activeTab === value;
    return (
      <TouchableOpacity
        onPress={() => setActiveTab(value)}
        style={[styles.tabButton, active && styles.tabButtonActive]}
      >
        <MaterialIcons name={icon} size={18} color={active ? '#6366f1' : '#9ca3af'} />
        <Text style={[styles.tabText, { color: active ? '#6366f1' : '#9ca3af' }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!session) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Navbar />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.userRow}>
            <LinearGradient colors={['#6366f1', '#7c3aed']} style={styles.avatar}>
              <Text style={styles.avatarText}>{session?.user?.email?.charAt(0).toUpperCase() || '?'}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Halo, {session?.user?.email?.split('@')[0] || 'Tamu'}!
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                Selamat datang di Dashboard CartaAI Anda.
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/generator')} style={styles.primaryWrap}>
              <LinearGradient colors={['#6366f1', '#7c3aed']} style={styles.primaryButton}>
                <MaterialIcons name="add" size={18} color="#fff" />
                <Text style={styles.primaryText}>Buat Undangan</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={[styles.logoutButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <MaterialIcons name="logout" size={18} color="#ef4444" />
              <Text style={styles.logoutText}>Keluar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'stretch' }}>
              
              {/* Left Column (Stats) */}
              <View style={{ flex: 1, gap: 12 }}>
                <StatCard title="Total Undangan" value={invitations.length} icon="description" colors={['#eff6ff', '#2563eb']} accentColors={['#3b82f6', '#6366f1']} />
                <StatCard title="Total Tamu" value={dynamicStats.total_guests} icon="people" colors={['#fffbeb', '#d97706']} accentColors={['#f59e0b', '#fbbf24']} />
              </View>

              {/* Right Column (Riwayat Button) */}
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/history')}
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  borderWidth: 1,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  minWidth: 90,
                  gap: 8,
                }}
              >
                <MaterialIcons name="history" size={28} color="#6366f1" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>Riwayat</Text>
              </TouchableOpacity>
              
            </View>
            
            {/* Filter Dropdown */}
            {invitations.length > 0 && (
              <View style={{ zIndex: 10 }}>
                <Text style={[styles.filterLabel, { color: theme.secondary }]}>Pilih Undangan untuk Data RSVP:</Text>
                <View style={[styles.dropdownContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <TouchableOpacity
                    onPress={() => setIsInvitationDropdownOpen(!isInvitationDropdownOpen)}
                    style={styles.dropdownHeader}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dropdownHeaderText, { color: theme.text }]} numberOfLines={1}>
                      {selectedInvitationFilter === 'all'
                        ? 'Semua Undangan'
                        : (() => {
                            const inv = invitations.find((i) => String(i.id_invitation) === selectedInvitationFilter);
                            if (!inv) return 'Pilih Undangan';
                            const c = inv.tbl_t_invitation_content || {};
                            return `${c.groom_name || 'Pria'} & ${c.bride_name || 'Wanita'}`;
                          })()}
                    </Text>
                    <MaterialIcons
                      name={isInvitationDropdownOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                      size={24}
                      color={theme.secondary}
                    />
                  </TouchableOpacity>

                  {isInvitationDropdownOpen && (
                    <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          selectedInvitationFilter === 'all' && { backgroundColor: theme.soft },
                        ]}
                        onPress={() => {
                          setSelectedInvitationFilter('all');
                          setIsInvitationDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            selectedInvitationFilter === 'all' ? { color: '#4f46e5', fontWeight: '700' } : { color: theme.text },
                          ]}
                        >
                          Semua Undangan
                        </Text>
                        {selectedInvitationFilter === 'all' && (
                          <MaterialIcons name="check" size={18} color="#4f46e5" />
                        )}
                      </TouchableOpacity>

                      {invitations.map((invitation) => {
                        const content = invitation.tbl_t_invitation_content || {};
                        const value = String(invitation.id_invitation);
                        const active = selectedInvitationFilter === value;
                        const title = (content.groom_name || 'Pria') + ' & ' + (content.bride_name || 'Wanita');

                        return (
                          <TouchableOpacity
                            key={value}
                            style={[
                              styles.dropdownItem,
                              active && { backgroundColor: theme.soft },
                            ]}
                            onPress={() => {
                              setSelectedInvitationFilter(value);
                              setIsInvitationDropdownOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                active ? { color: '#4f46e5', fontWeight: '700' } : { color: theme.text },
                              ]}
                              numberOfLines={1}
                            >
                              {title}
                            </Text>
                            {active && <MaterialIcons name="check" size={18} color="#4f46e5" />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {selectedInvitationFilter !== 'all' && (
                  <TouchableOpacity
                    onPress={() => {
                      const inv = invitations.find((i) => String(i.id_invitation) === selectedInvitationFilter);
                      if (inv) handleShareClick(inv.invitation_link);
                    }}
                    style={[styles.primaryWrap, { marginTop: 12, marginBottom: 0 }]}
                  >
                    <LinearGradient colors={['#6366f1', '#7c3aed']} style={styles.manageButton}>
                      <MaterialIcons name="group" size={18} color="#fff" />
                      <Text style={styles.manageText}>Daftar Tamu & Kirim</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <StatCard title="Total RSVP" value={dynamicStats.total} icon="group" colors={['#faf5ff', '#9333ea']} accentColors={['#8b5cf6', '#a855f7']} />
            <StatCard title="Tamu Hadir" value={dynamicStats.hadir} icon="check-circle" colors={['#f0fdf4', '#16a34a']} accentColors={['#10b981', '#34d399']} />
            <StatCard title="Tamu Berhalangan" value={dynamicStats.tidak_hadir} icon="cancel" colors={['#fef2f2', '#dc2626']} accentColors={['#ef4444', '#f87171']} />
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.tabsRow, { borderBottomColor: theme.border }]}>
            <TabButton label="Data RSVP" value="rsvps" icon="badge" />
            <TabButton label="Ucapan & Doa" value="messages" icon="chat" />
          </View>

          {/* Custom dropdown UI for the stats replaces the original global tabs filter row. We moved it up to affect the stats too. */}

          <View style={styles.contentArea}>
            {loading ? (
              <ActivityIndicator size="large" color="#6366f1" style={{ marginVertical: 32 }} />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : activeTab === 'rsvps' ? (
              filteredRsvps.length > 0 ? (
                filteredRsvps.map((item, index) => (
                  <View key={`${item.id || index}`} style={[styles.rowItem, { borderBottomColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: theme.text }]}>{item.nama}</Text>
                      <Text style={[styles.rowSub, { color: theme.muted }]}>{item.nama_undangan}</Text>
                    </View>
                    <View
                      style={[
                        styles.rowBadge,
                        { backgroundColor: String(item.kehadiran).toLowerCase() === 'hadir' ? '#dcfce7' : '#fee2e2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.rowBadgeText,
                          { color: String(item.kehadiran).toLowerCase() === 'hadir' ? '#166534' : '#991b1b' },
                        ]}
                      >
                        {item.kehadiran}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: theme.muted }]}>Belum ada tamu yang mengisi RSVP.</Text>
              )
            ) : filteredRsvps.filter((item) => item.ucapan).length > 0 ? (
              filteredRsvps
                .filter((item) => item.ucapan)
                .map((item, index) => (
                  <View
                    key={`${item.id || index}`}
                    style={[styles.messageCard, { backgroundColor: theme.soft, borderColor: theme.border }]}
                  >
                    <View style={styles.messageHeader}>
                      <Text style={[styles.messageName, { color: theme.text }]}>{item.nama}</Text>
                      <Text style={[styles.messageUndangan, { color: theme.muted }]}>{item.nama_undangan}</Text>
                    </View>
                    <Text style={[styles.messageBody, { color: theme.secondary }]}>"{item.ucapan}"</Text>
                  </View>
                ))
            ) : (
              <Text style={[styles.emptyText, { color: theme.muted }]}>Belum ada ucapan atau doa masuk.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <GuestManagementModal
        visible={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        slug={shareSlug}
        sessionToken={session?.access_token || ''}
        apiBaseUrl={API_BASE_URL || ''}
      />

      <Modal visible={deleteModalOpen} transparent animationType="fade">
        <View style={styles.deleteOverlay}>
          <View style={[styles.deleteCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.deleteTitle, { color: theme.text }]}>Hapus Undangan?</Text>
            <Text style={[styles.deleteSubtitle, { color: theme.muted }]}>
              Tindakan ini permanen dan akan menghapus semua data tamu yang terkait.
            </Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity
                onPress={() => {
                  setDeleteModalOpen(false);
                  setInvitationToDelete(null);
                }}
                style={[styles.cancelButton, { backgroundColor: theme.soft }]}
              >
                <Text style={[styles.cancelText, { color: theme.secondary }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDeleteInvitation} style={styles.confirmButton}>
                <Text style={styles.confirmText}>Ya, Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { gap: 18, marginBottom: 20 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 10 },
  primaryWrap: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  primaryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  logoutButton: { minWidth: 110, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 14 },
  logoutText: { color: '#ef4444', fontSize: 14, fontWeight: '800' },
  statsGrid: { gap: 12, marginBottom: 20 },
  statCard: { borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' },
  statAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  statIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statTitle: { fontSize: 12, fontWeight: '600' },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  filterLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  dropdownContainer: { borderWidth: 1, borderRadius: 14, position: 'relative', zIndex: 100 },
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  dropdownHeaderText: { fontSize: 14, fontWeight: '700', flex: 1, paddingRight: 10 },
  dropdownMenu: { position: 'absolute', top: '100%', left: 0, right: 0, borderWidth: 1, borderRadius: 14, marginTop: 4, zIndex: 999, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  dropdownItemText: { fontSize: 14, fontWeight: '500', flex: 1, paddingRight: 10 },
  panel: { borderWidth: 1, borderRadius: 24, overflow: 'hidden', zIndex: 1 },
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tabButton: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 4, borderBottomWidth: 2, borderBottomColor: 'transparent', paddingHorizontal: 8 },
  tabButtonActive: { borderBottomColor: '#6366f1' },
  tabText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  filterRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  filterChip: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
  filterChipActive: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  filterChipText: { fontSize: 12, fontWeight: '700' },
  contentArea: { paddingHorizontal: 16, paddingBottom: 16 },
  invCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12, overflow: 'hidden' },
  invAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  invHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  activeBadge: { backgroundColor: '#e0e7ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  activeBadgeText: { color: '#4338ca', fontSize: 10, fontWeight: '800' },
  invDate: { fontSize: 10, fontWeight: '700' },
  invNames: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  manageButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 14 },
  manageText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  invActions: { flexDirection: 'row', gap: 10 },
  viewButton: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  viewText: { fontSize: 12, fontWeight: '800' },
  deleteButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' },
  rowItem: { paddingVertical: 14, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontSize: 14, fontWeight: '800' },
  rowSub: { fontSize: 11, marginTop: 2 },
  rowBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  rowBadgeText: { fontSize: 10, fontWeight: '800' },
  messageCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  messageName: { flex: 1, fontSize: 14, fontWeight: '800' },
  messageUndangan: { fontSize: 10, fontWeight: '700' },
  messageBody: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  emptyText: { textAlign: 'center', fontSize: 14, paddingVertical: 32 },
  errorText: { textAlign: 'center', color: '#ef4444', fontWeight: '700', paddingVertical: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '88%', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  textArea: { minHeight: 120, borderWidth: 1, borderRadius: 16, padding: 14, textAlignVertical: 'top', marginBottom: 14 },
  guestTitle: { fontSize: 16, fontWeight: '800', marginTop: 6, marginBottom: 12 },
  guestRow: { paddingVertical: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  guestName: { flex: 1, fontSize: 14, fontWeight: '700' },
  guestActions: { flexDirection: 'row', gap: 8 },
  smallAction: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deleteOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  deleteCard: { width: '100%', borderRadius: 22, padding: 20 },
  deleteTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  deleteSubtitle: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  deleteActions: { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontWeight: '800' },
  confirmButton: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#fff', fontWeight: '800' },
});
