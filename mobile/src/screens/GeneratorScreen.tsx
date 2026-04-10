import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { API_BASE_URL } from '../lib/api';
import { supabase } from '../supabaseClient';

type UploadAsset = {
  uri: string;
  name: string;
  mimeType?: string;
};

type GiftItem = {
  namaBank: string;
  customBank?: string;
  noRekening: string;
  namaRekening: string;
};

type FormState = {
  namaMempelaiPria: string;
  namaAyahMempelaiPria: string;
  namaIbuMempelaiPria: string;
  namaMempelaiWanita: string;
  namaAyahMempelaiWanita: string;
  namaIbuMempelaiWanita: string;
  tanggalAcara: Date;
  waktuAcara: string;
  lokasiAcara: string;
  waktuResepsi: string;
  tempatResepsi: string;
  temaWarna: string;
  jenisUndangan: string;
  agama: string;
  catatanKhusus: string;
  fotoCover: UploadAsset | null;
  fotoMempelaiPria: UploadAsset | null;
  fotoMempelaiWanita: UploadAsset | null;
  galeriFoto: UploadAsset[];
  musik: UploadAsset | null;
  hadiah: GiftItem[];
};

type Message = {
  id: number;
  type: 'bot' | 'user';
  content: string;
};

const gradientPrimary = ['#667eea', '#764ba2'] as const;
const gradientPremium = ['#fbbf24', '#f97316'] as const;
const gradientFree = ['#6b7280', '#4b5563'] as const;
const agamaOptions = ['islam', 'kristen', 'hindu', 'buddha', 'lainnya'];
const temaOptions = [
  'soft-pink',
  'sage-green',
  'navy-gold',
  'terracotta',
  'monochrome',
];
const jenisOptions = [
  'klasik',
  'modern',
  'rustic',
  'minimalis',
  'luxury',
  'vintage',
];
const bankOptions = ['BCA', 'BNI', 'BRI', 'Mandiri', 'GoPay', 'OVO', 'Dana', 'Lainnya'];

const initialFormState: FormState = {
  namaMempelaiPria: '',
  namaAyahMempelaiPria: '',
  namaIbuMempelaiPria: '',
  namaMempelaiWanita: '',
  namaAyahMempelaiWanita: '',
  namaIbuMempelaiWanita: '',
  tanggalAcara: new Date(),
  waktuAcara: '',
  lokasiAcara: '',
  waktuResepsi: '',
  tempatResepsi: '',
  temaWarna: '',
  jenisUndangan: '',
  agama: '',
  catatanKhusus: '',
  fotoCover: null,
  fotoMempelaiPria: null,
  fotoMempelaiWanita: null,
  galeriFoto: [],
  musik: null,
  hadiah: [],
};

const toUploadAsset = (asset: { uri: string; name?: string; mimeType?: string }) => ({
  uri: asset.uri,
  name: asset.name || `file-${Date.now()}`,
  mimeType: asset.mimeType,
});

async function uploadFile(file: UploadAsset, userId: string, folder: string) {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${userId}/${folder}/${Date.now()}-${sanitizedName}`;
  const response = await fetch(file.uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from('invitation-assets')
    .upload(filePath, arrayBuffer, {
      contentType: file.mimeType || 'application/octet-stream',
      upsert: false,
    });

  if (error) {
    throw new Error(`Gagal meng-upload ${file.name}: ${error.message}`);
  }

  const { data } = supabase.storage.from('invitation-assets').getPublicUrl(filePath);
  return data.publicUrl;
}

async function uploadAssets(files: FormState, userId: string) {
  const uploadedUrls: Record<string, unknown> = {};

  if (files.fotoCover) {
    uploadedUrls.fotoCover = await uploadFile(files.fotoCover, userId, 'cover');
  }
  if (files.fotoMempelaiPria) {
    uploadedUrls.fotoMempelaiPria = await uploadFile(files.fotoMempelaiPria, userId, 'groom');
  }
  if (files.fotoMempelaiWanita) {
    uploadedUrls.fotoMempelaiWanita = await uploadFile(files.fotoMempelaiWanita, userId, 'bride');
  }
  if (files.musik) {
    uploadedUrls.musik = await uploadFile(files.musik, userId, 'music');
  }
  if (files.galeriFoto.length > 0) {
    uploadedUrls.galeriFoto = await Promise.all(
      files.galeriFoto.map((file) => uploadFile(file, userId, 'gallery'))
    );
  }

  return uploadedUrls;
}

function OptionChips({
  options,
  value,
  onChange,
  disabled,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.chipsWrap}>
      {options.map((option) => {
        const active = value === option;
        return (
          <TouchableOpacity
            key={option}
            disabled={disabled}
            onPress={() => onChange(option)}
            style={[
              styles.chip,
              active && styles.chipActive,
              disabled && styles.chipDisabled,
            ]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

type GeneratorMode = 'auto' | 'free' | 'premium';

export function GeneratorModeScreen({
  mode = 'auto',
}: {
  mode?: GeneratorMode;
}) {
  const insets = useSafeAreaInsets();
  const { session, userProfile, loading } = useAuth();
  const { darkMode } = useDarkMode();
  const router = useRouter();
  const { refreshProfile } = useAuth();

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile])
  );
  const isPremium =
    mode === 'premium'
      ? true
      : mode === 'free'
      ? false
      : userProfile?.subscription_status === 'premium';

  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: isPremium
        ? 'Halo! Saya CartaAI. Lengkapi detail kebahagiaan Anda pada formulir, dan saya akan merangkai undangan digital premium yang eksklusif dan tak terlupakan untuk Anda.'
        : 'Halo! Saya CartaAI. Silakan isi formulir di bawah, dan saya akan membantu membuatkan undangan digital yang cantik untuk momen spesial Anda.',
    },
  ]);

  const theme = useMemo(
    () => ({
      bg: darkMode ? '#111827' : '#f9fafb',
      card: darkMode ? '#1f2937' : '#ffffff',
      text: darkMode ? '#ffffff' : '#111827',
      subtext: darkMode ? '#d1d5db' : '#4b5563',
      muted: darkMode ? '#9ca3af' : '#6b7280',
      inputBg: darkMode ? '#374151' : '#f9fafb',
      border: darkMode ? '#4b5563' : '#d1d5db',
      soft: darkMode ? '#0f172a' : '#f3f4f6',
    }),
    [darkMode]
  );

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const pickImage = async (key: 'fotoCover' | 'fotoMempelaiPria' | 'fotoMempelaiWanita') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin dibutuhkan', 'Akses galeri diperlukan untuk memilih gambar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      updateField(key, toUploadAsset(result.assets[0]));
    }
  };

  const pickGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin dibutuhkan', 'Akses galeri diperlukan untuk memilih gambar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (!result.canceled) {
      const nextFiles = result.assets.map((asset) => toUploadAsset(asset));
      updateField('galeriFoto', [...formData.galeriFoto, ...nextFiles]);
    }
  };

  const pickMusic = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      updateField('musik', toUploadAsset(result.assets[0]));
    }
  };

  const removeGalleryItem = (index: number) => {
    updateField(
      'galeriFoto',
      formData.galeriFoto.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const addGift = () => {
    updateField('hadiah', [
      ...formData.hadiah,
      { namaBank: '', noRekening: '', namaRekening: '' },
    ]);
  };

  const updateGift = (index: number, key: keyof GiftItem, value: string) => {
    updateField(
      'hadiah',
      formData.hadiah.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    );
  };

  const removeGift = (index: number) => {
    updateField(
      'hadiah',
      formData.hadiah.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const onChangeDate = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      updateField('tanggalAcara', selectedDate);
    }
  };

  const openGeneratedLink = async () => {
    if (!generatedLink) return;
    await Linking.openURL(generatedLink);
  };

  const handleGenerate = async () => {
    const requiredFields: Array<keyof FormState> = [
      'namaMempelaiPria',
      'namaMempelaiWanita',
      'lokasiAcara',
    ];

    const missing = requiredFields.filter((field) => !String(formData[field]).trim());
    if (missing.length > 0) {
      Alert.alert('Mohon lengkapi', `Field wajib harus diisi: ${missing.join(', ')}`);
      return;
    }

    if (!session?.access_token || !session.user) {
      Alert.alert('Login diperlukan', 'Anda harus login untuk membuat undangan.');
      router.push('/login');
      return;
    }

    setShowChat(true);
    setIsLoading(true);
    setGeneratedLink('');

    try {
      const randomString = Math.random().toString(36).substring(2, 8);
      const slug = `${formData.namaMempelaiPria || 'undangan'}-${randomString}`
        .toLowerCase()
        .replace(/\s+/g, '-');

      let assetUrls: Record<string, unknown> = {};
      if (isPremium) {
        setLoadingMessage('Meng-upload gambar dan musik...');
        assetUrls = await uploadAssets(formData, session.user.id);
      }

      const processedHadiah = formData.hadiah.map((item) => ({
        ...item,
        namaBank: item.namaBank === 'Lainnya' ? item.customBank || '' : item.namaBank,
      }));

      setLoadingMessage('Menghubungi AI untuk membuat file undangan...');

      const {
        fotoCover,
        fotoMempelaiPria,
        fotoMempelaiWanita,
        galeriFoto,
        musik,
        ...restFormData
      } = formData;

      const payload = {
        ...restFormData,
        ...assetUrls,
        tanggalAcara: formData.tanggalAcara.toISOString().split('T')[0],
        hadiah: isPremium ? processedHadiah : [],
        slug,
        frontendUrl: API_BASE_URL,
      };

      const endpoint = isPremium
        ? `${API_BASE_URL}/api/invitations/generate`
        : `${API_BASE_URL}/api/invitations/generate-free`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Gagal membuat undangan.');
      }

      const finalUrl = `${API_BASE_URL}/api/invitations/${slug}`;
      setGeneratedLink(finalUrl);
      
      // Beri sedikit jeda agar animasi loading di AI terlihat natural, lalu alihkan
      setTimeout(() => {
        router.push({
          pathname: '/success',
          params: { slug }
        });
        // Sembunyikan chat agar jika user kembali (untuk edit), mereka langsung melihat form
        setShowChat(false);
      }, 1000);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan.';
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          type: 'bot',
          content: `Maaf, terjadi kesalahan:\n${message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const renderInput = ({
    label,
    required,
    value,
    onChangeText,
    placeholder,
    multiline,
  }: {
    label: string;
    required?: boolean;
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    multiline?: boolean;
  }) => (
    <View style={styles.fieldBlock}>
      <Text style={[styles.label, { color: theme.subtext }]}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        multiline={multiline}
        style={[
          styles.input,
          {
            backgroundColor: theme.inputBg,
            borderColor: theme.border,
            color: theme.text,
            height: multiline ? 96 : 52,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
      />
    </View>
  );

  const renderUploadCard = ({
    title,
    value,
    image,
    onPick,
    onRemove,
    locked,
  }: {
    title: string;
    value?: string | null;
    image?: string | null;
    onPick?: () => void;
    onRemove?: () => void;
    locked?: boolean;
  }) => (
    <View style={styles.fieldBlock}>
      <Text style={[styles.label, { color: theme.subtext }]}>{title}</Text>
      {locked ? (
        <View
          style={[
            styles.lockedField,
            { backgroundColor: theme.soft, borderColor: theme.border },
          ]}
        >
          <MaterialIcons name="lock" size={16} color="#f59e0b" />
          <Text style={styles.lockedInlineText}>Terkunci (Premium)</Text>
        </View>
      ) : value || image ? (
        <View
          style={[
            styles.previewCard,
            { backgroundColor: theme.soft, borderColor: theme.border },
          ]}
        >
          {image ? <Image source={{ uri: image }} style={styles.previewImage} /> : null}
          <Text style={[styles.previewText, { color: theme.text }]} numberOfLines={1}>
            {value}
          </Text>
          <TouchableOpacity onPress={onRemove}>
            <Text style={styles.removeText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onPick}
          style={[
            styles.uploadButton,
            { backgroundColor: theme.soft, borderColor: theme.border },
          ]}
        >
          <MaterialIcons name="upload-file" size={18} color="#6366f1" />
          <Text style={styles.uploadText}>Pilih File</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderDropdown = ({
    label,
    value,
    placeholder,
    options,
    fieldKey,
    disabled,
  }: {
    label: string;
    value: string;
    placeholder: string;
    options: string[];
    fieldKey: 'agama' | 'temaWarna' | 'jenisUndangan';
    disabled?: boolean;
  }) => {
    const isOpen = openDropdown === fieldKey;

    return (
      <View style={styles.fieldBlock}>
        <Text style={[styles.label, { color: theme.subtext }]}>{label}</Text>
        <TouchableOpacity
          disabled={disabled}
          onPress={() => setOpenDropdown((prev) => (prev === fieldKey ? null : fieldKey))}
          style={[
            styles.input,
            styles.dateInput,
            {
              backgroundColor: disabled ? theme.soft : theme.inputBg,
              borderColor: theme.border,
              opacity: disabled ? 0.6 : 1,
            },
          ]}
        >
          <Text style={{ color: value ? theme.text : '#9ca3af', textTransform: 'capitalize' }}>
            {value || placeholder}
          </Text>
          <MaterialIcons
            name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={20}
            color="#6366f1"
          />
        </TouchableOpacity>

        {isOpen && !disabled ? (
          <View
            style={[
              styles.dropdownPanel,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  updateField(fieldKey, option);
                  setOpenDropdown(null);
                }}
                style={[
                  styles.dropdownItem,
                  value === option && styles.dropdownItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    value === option && styles.dropdownItemTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg, paddingTop: insets.top > 0 ? insets.top : 20 }]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top > 0 ? insets.top : 20 }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View
            style={[
              styles.badge,
              { backgroundColor: isPremium ? '#fef3c7' : '#e5e7eb' },
            ]}
          >
            <MaterialIcons
              name={isPremium ? 'workspace-premium' : 'star-outline'}
              size={16}
              color={isPremium ? '#b45309' : '#4b5563'}
            />
            <Text
              style={[
                styles.badgeText,
                { color: isPremium ? '#b45309' : '#4b5563' },
              ]}
            >
              {isPremium ? 'PREMIUM GENERATOR' : 'FREE GENERATOR'}
            </Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            Generator Undangan Pernikahan
          </Text>
          <LinearGradient
            colors={isPremium ? gradientPremium : gradientFree}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titlePill}
          >
            <Text style={styles.titlePillText}>{isPremium ? 'Premium' : 'Gratis'}</Text>
          </LinearGradient>

          <View style={styles.separatorWrap}>
            <View style={styles.separatorLine} />
            <View style={styles.separatorDot} />
          </View>

          <Text style={[styles.subtitle, { color: theme.muted }]}>
            {isPremium
              ? 'Rangkai momen indah Anda menjadi undangan digital yang elegan. Lengkapi formulir di bawah ini, dan biarkan CartaAI menghadirkan kemewahan untuk hari spesial Anda.'
              : 'Wujudkan undangan digital cantik untuk hari bahagia Anda. Isi formulir di bawah ini dan CartaAI akan segera menyiapkannya untuk Anda.'}
          </Text>
        </View>

        {!showChat ? (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <LinearGradient colors={gradientPrimary} style={styles.topBar} />
            <LinearGradient colors={gradientPrimary} style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Detail Acara Pernikahan</Text>
              <Text style={styles.cardSubtitle}>
                Lengkapi informasi di bawah ini untuk membuat undangan
                {isPremium ? ' premium' : ' gratis'}
              </Text>
            </LinearGradient>

            <View style={styles.cardBody}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Informasi Wajib
              </Text>

              {renderInput({
                label: 'Nama Mempelai Pria',
                required: true,
                value: formData.namaMempelaiPria,
                onChangeText: (value) => updateField('namaMempelaiPria', value),
                placeholder: 'Masukkan nama mempelai pria',
              })}
              {renderInput({
                label: 'Nama Ayah Mempelai Pria',
                value: formData.namaAyahMempelaiPria,
                onChangeText: (value) => updateField('namaAyahMempelaiPria', value),
                placeholder: 'Masukkan nama ayah mempelai pria',
              })}
              {renderInput({
                label: 'Nama Ibu Mempelai Pria',
                value: formData.namaIbuMempelaiPria,
                onChangeText: (value) => updateField('namaIbuMempelaiPria', value),
                placeholder: 'Masukkan nama ibu mempelai pria',
              })}
              {renderInput({
                label: 'Nama Mempelai Wanita',
                required: true,
                value: formData.namaMempelaiWanita,
                onChangeText: (value) => updateField('namaMempelaiWanita', value),
                placeholder: 'Masukkan nama mempelai wanita',
              })}
              {renderInput({
                label: 'Nama Ayah Mempelai Wanita',
                value: formData.namaAyahMempelaiWanita,
                onChangeText: (value) => updateField('namaAyahMempelaiWanita', value),
                placeholder: 'Masukkan nama ayah mempelai wanita',
              })}
              {renderInput({
                label: 'Nama Ibu Mempelai Wanita',
                value: formData.namaIbuMempelaiWanita,
                onChangeText: (value) => updateField('namaIbuMempelaiWanita', value),
                placeholder: 'Masukkan nama ibu mempelai wanita',
              })}

              <View style={styles.fieldBlock}>
                <Text style={[styles.label, { color: theme.subtext }]}>
                  Tanggal Acara<Text style={styles.required}> *</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={[
                    styles.input,
                    styles.dateInput,
                    { backgroundColor: theme.inputBg, borderColor: theme.border },
                  ]}
                >
                  <Text style={{ color: theme.text }}>
                    {formData.tanggalAcara.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                  <MaterialIcons name="calendar-today" size={18} color="#6366f1" />
                </TouchableOpacity>
                {showDatePicker ? (
                  <DateTimePicker
                    value={formData.tanggalAcara}
                    mode="date"
                    onChange={onChangeDate}
                  />
                ) : null}
              </View>

              {renderInput({
                label: 'Waktu Acara',
                value: formData.waktuAcara,
                onChangeText: (value) => updateField('waktuAcara', value),
                placeholder: 'Contoh: 09:00 WITA',
              })}
              {renderInput({
                label: 'Lokasi Acara',
                required: true,
                value: formData.lokasiAcara,
                onChangeText: (value) => updateField('lokasiAcara', value),
                placeholder: 'Masukkan alamat lengkap lokasi acara',
                multiline: true,
              })}
              {renderInput({
                label: 'Waktu Resepsi',
                value: formData.waktuResepsi,
                onChangeText: (value) => updateField('waktuResepsi', value),
                placeholder: 'Contoh: 11:00 WITA',
              })}
              {renderInput({
                label: 'Tempat Resepsi',
                value: formData.tempatResepsi,
                onChangeText: (value) => updateField('tempatResepsi', value),
                placeholder: 'Masukkan alamat lengkap resepsi',
                multiline: true,
              })}

              <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 12 }]}>
                Informasi Tambahan & Aset
              </Text>

              {renderDropdown({
                label: 'Agama',
                value: formData.agama,
                placeholder: 'Pilih agama',
                options: agamaOptions,
                fieldKey: 'agama',
              })}

              {renderDropdown({
                label: 'Tema Warna',
                value: formData.temaWarna,
                placeholder: isPremium ? 'Pilih tema warna' : 'Terkunci (Premium)',
                options: temaOptions,
                fieldKey: 'temaWarna',
                disabled: !isPremium,
              })}

              {renderDropdown({
                label: 'Jenis Undangan',
                value: formData.jenisUndangan,
                placeholder: isPremium ? 'Pilih jenis undangan' : 'Terkunci (Premium)',
                options: jenisOptions,
                fieldKey: 'jenisUndangan',
                disabled: !isPremium,
              })}

              {renderUploadCard({
                title: 'Foto Cover Prewedding',
                image: formData.fotoCover?.uri,
                value: formData.fotoCover?.name,
                onPick: () => pickImage('fotoCover'),
                onRemove: () => updateField('fotoCover', null),
                locked: !isPremium,
              })}
              {renderUploadCard({
                title: 'Musik Latar',
                value: formData.musik?.name,
                onPick: pickMusic,
                onRemove: () => updateField('musik', null),
                locked: !isPremium,
              })}
              {renderUploadCard({
                title: 'Foto Mempelai Pria',
                image: formData.fotoMempelaiPria?.uri,
                value: formData.fotoMempelaiPria?.name,
                onPick: () => pickImage('fotoMempelaiPria'),
                onRemove: () => updateField('fotoMempelaiPria', null),
                locked: !isPremium,
              })}
              {renderUploadCard({
                title: 'Foto Mempelai Wanita',
                image: formData.fotoMempelaiWanita?.uri,
                value: formData.fotoMempelaiWanita?.name,
                onPick: () => pickImage('fotoMempelaiWanita'),
                onRemove: () => updateField('fotoMempelaiWanita', null),
                locked: !isPremium,
              })}

              <View style={styles.fieldBlock}>
                <Text style={[styles.label, { color: theme.subtext }]}>
                  Galeri Foto Pre-Wedding
                </Text>
                {!isPremium ? (
                  <View
                    style={[
                      styles.lockedField,
                      { backgroundColor: theme.soft, borderColor: theme.border },
                    ]}
                  >
                    <MaterialIcons name="lock" size={16} color="#f59e0b" />
                    <Text style={styles.lockedInlineText}>Terkunci (Premium)</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={pickGallery}
                      style={[
                        styles.uploadButton,
                        { backgroundColor: theme.soft, borderColor: theme.border },
                      ]}
                    >
                      <MaterialIcons name="collections" size={18} color="#6366f1" />
                      <Text style={styles.uploadText}>Pilih Galeri</Text>
                    </TouchableOpacity>
                    {formData.galeriFoto.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.galleryRow}
                      >
                        {formData.galeriFoto.map((item, index) => (
                          <View key={`${item.uri}-${index}`} style={styles.galleryCard}>
                            <Image source={{ uri: item.uri }} style={styles.galleryImage} />
                            <TouchableOpacity
                              onPress={() => removeGalleryItem(index)}
                              style={styles.galleryRemove}
                            >
                              <MaterialIcons name="close" size={14} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    ) : null}
                  </>
                )}
              </View>

              {renderInput({
                label: 'Catatan Khusus',
                value: formData.catatanKhusus,
                onChangeText: (value) => updateField('catatanKhusus', value),
                placeholder: 'Tambahkan catatan khusus atau permintaan lainnya...',
                multiline: true,
              })}

              <View style={styles.fieldBlock}>
                <View style={styles.giftHeader}>
                  <Text style={[styles.label, { color: theme.subtext }]}>
                    Amplop Digital (Opsional)
                  </Text>
                  {isPremium ? (
                    <TouchableOpacity onPress={addGift}>
                      <Text style={styles.addGiftText}>+ Tambah</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {!isPremium ? (
                  <View
                    style={[
                      styles.lockedField,
                      { backgroundColor: theme.soft, borderColor: theme.border },
                    ]}
                  >
                    <MaterialIcons name="lock" size={16} color="#f59e0b" />
                    <Text style={styles.lockedInlineText}>
                      Tambahkan rekening bank atau e-wallet (Khusus Premium)
                    </Text>
                  </View>
                ) : formData.hadiah.length === 0 ? (
                  <View
                    style={[
                      styles.emptyGiftBox,
                      { backgroundColor: theme.soft, borderColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.emptyGiftText, { color: theme.muted }]}>
                      Belum ada rekening atau e-wallet yang ditambahkan.
                    </Text>
                  </View>
                ) : (
                  formData.hadiah.map((item, index) => (
                    <View
                      key={`gift-${index}`}
                      style={[
                        styles.giftCard,
                        { backgroundColor: theme.soft, borderColor: theme.border },
                      ]}
                    >
                      <View style={styles.giftHeader}>
                        <Text style={[styles.giftTitle, { color: theme.text }]}>
                          Gift #{index + 1}
                        </Text>
                        <TouchableOpacity onPress={() => removeGift(index)}>
                          <Text style={styles.removeText}>Hapus</Text>
                        </TouchableOpacity>
                      </View>

                      <OptionChips
                        options={bankOptions}
                        value={item.namaBank}
                        onChange={(value) => updateGift(index, 'namaBank', value)}
                      />

                      {item.namaBank === 'Lainnya'
                        ? renderInput({
                            label: 'Nama Bank / E-Wallet',
                            value: item.customBank || '',
                            onChangeText: (value) =>
                              updateGift(index, 'customBank', value),
                            placeholder: 'Ketik nama bank / e-wallet',
                          })
                        : null}

                      {renderInput({
                        label: 'Nomor Rekening / No HP',
                        value: item.noRekening,
                        onChangeText: (value) =>
                          updateGift(index, 'noRekening', value),
                        placeholder: 'Masukkan nomor rekening / no HP',
                      })}
                      {renderInput({
                        label: 'Atas Nama',
                        value: item.namaRekening,
                        onChangeText: (value) =>
                          updateGift(index, 'namaRekening', value),
                        placeholder: 'Masukkan nama pemilik rekening',
                      })}
                    </View>
                  ))
                )}
              </View>

              <View style={styles.actionGroup}>
                <TouchableOpacity onPress={handleGenerate} disabled={isLoading}>
                  <LinearGradient colors={gradientPrimary} style={styles.primaryButton}>
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="auto-awesome" size={18} color="#fff" />
                        <Text style={styles.primaryButtonText}>
                          {isPremium
                            ? 'Generate Undangan Premium'
                            : 'Generate Undangan Gratis'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {!isPremium ? (
                  <TouchableOpacity onPress={() => router.push('/harga')}>
                    <LinearGradient colors={gradientPremium} style={styles.secondaryButton}>
                      <MaterialIcons name="diamond" size={18} color="#fff" />
                      <Text style={styles.primaryButtonText}>Upgrade Premium</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.chatCard, { backgroundColor: theme.card }]}>
            <LinearGradient colors={gradientPrimary} style={styles.topBar} />
            <ScrollView contentContainerStyle={styles.chatBody} showsVerticalScrollIndicator={false}>
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.chatRow,
                    message.type === 'user' ? styles.chatRowRight : styles.chatRowLeft,
                  ]}
                >
                  {message.type === 'user' ? (
                    <LinearGradient colors={gradientPrimary} style={styles.userBubble}>
                      <Text style={styles.userBubbleText}>{message.content}</Text>
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.botBubble,
                        { backgroundColor: theme.soft, borderColor: theme.border },
                      ]}
                    >
                      <Text style={[styles.botBubbleText, { color: theme.text }]}>
                        {message.content}
                      </Text>

                      {generatedLink && message.content.includes('Undangan siap!') ? (
                        <View style={styles.resultActions}>
                          <TouchableOpacity onPress={openGeneratedLink}>
                            <LinearGradient colors={gradientFree} style={styles.resultButton}>
                              <MaterialIcons name="visibility" size={16} color="#fff" />
                              <Text style={styles.resultButtonText}>Lihat Pratinjau</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                            <View style={styles.resultGhostButton}>
                              <MaterialIcons name="group" size={16} color="#475569" />
                              <Text style={styles.resultGhostText}>Kelola Tamu</Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              ))}

              {isLoading ? (
                <View
                  style={[
                    styles.loadingPanel,
                    { backgroundColor: theme.soft, borderColor: theme.border },
                  ]}
                >
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text style={[styles.loadingPanelText, { color: theme.muted }]}>
                    {loadingMessage || 'Memproses...'}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowChat(false)}
              style={[styles.editButton, { backgroundColor: theme.soft }]}
            >
              <Text style={[styles.editButtonText, { color: theme.text }]}>Edit Form</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function GeneratorScreen() {
  return <GeneratorModeScreen mode="auto" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  titlePill: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
  },
  titlePillText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  separatorWrap: {
    width: 140,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  separatorLine: {
    width: '100%',
    height: 4,
    borderRadius: 999,
    backgroundColor: '#8b5cf6',
  },
  separatorDot: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: '#6366f1',
    backgroundColor: '#fff',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 24,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  topBar: {
    height: 4,
  },
  cardHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontSize: 14,
  },
  cardBody: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 18,
  },
  fieldBlock: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  chipDisabled: {
    opacity: 0.45,
  },
  chipText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: '#4f46e5',
  },
  dropdownPanel: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownItemActive: {
    backgroundColor: '#eef2ff',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'capitalize',
  },
  dropdownItemTextActive: {
    color: '#4f46e5',
  },
  uploadButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadText: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  previewText: {
    fontSize: 13,
    fontWeight: '600',
  },
  removeText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  lockedField: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockedInlineText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  galleryRow: {
    marginTop: 12,
  },
  galleryCard: {
    marginRight: 12,
    position: 'relative',
  },
  galleryImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  galleryRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: 'rgba(220,38,38,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addGiftText: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  emptyGiftBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  emptyGiftText: {
    fontSize: 13,
  },
  giftCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
  },
  giftTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionGroup: {
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  chatCard: {
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 420,
  },
  chatBody: {
    padding: 20,
    gap: 12,
  },
  chatRow: {
    width: '100%',
  },
  chatRowLeft: {
    alignItems: 'flex-start',
  },
  chatRowRight: {
    alignItems: 'flex-end',
  },
  userBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    maxWidth: '88%',
  },
  userBubbleText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 21,
  },
  botBubble: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    maxWidth: '92%',
    gap: 12,
  },
  botBubbleText: {
    fontSize: 14,
    lineHeight: 22,
  },
  loadingPanel: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingPanelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultActions: {
    gap: 10,
  },
  resultButton: {
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resultButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  resultGhostButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resultGhostText: {
    color: '#475569',
    fontWeight: '800',
  },
  editButton: {
    margin: 20,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editButtonText: {
    fontWeight: '800',
  },
});
