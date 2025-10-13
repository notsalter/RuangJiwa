import React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Avatar, Button, HelperText, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/store/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/navigation/types';
import { useTranslation } from 'react-i18next';
import { auth } from '@/services/firebase';
import { updateEmail, updateProfile } from 'firebase/auth';
import { upsertUserProfile, uploadProfileImage } from '@/services/collections/users';

type ProfileEditProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileEdit'>;

export default function ProfileEdit({ navigation }: ProfileEditProps) {
  const { t } = useTranslation('common');
  const profile = useAuth(state => state.profile);
  const setProfile = useAuth(state => state.setProfile);
  const [name, setName] = React.useState(profile?.name ?? '');
  const [email, setEmail] = React.useState(profile?.email ?? '');
  const [localPhotoUri, setLocalPhotoUri] = React.useState<string | undefined>();
  const [error, setError] = React.useState<string | undefined>();
  const [saving, setSaving] = React.useState(false);

  const currentPhoto = localPhotoUri ?? profile?.photoUrl;

  const requestImage = React.useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('profile.mediaPermissionTitle', { defaultValue: 'Izin Diperlukan' }),
        t('profile.mediaPermissionMessage', { defaultValue: 'Kami memerlukan izin untuk mengakses galeri kamu.' })
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      setLocalPhotoUri(result.assets[0].uri);
    }
  }, [t]);

  const handleSave = React.useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError(t('profile.validation.nameRequired', { defaultValue: 'Nama tidak boleh kosong.' }));
      return;
    }

    if (!trimmedEmail) {
      setError(t('profile.validation.emailRequired', { defaultValue: 'Email tidak boleh kosong.' }));
      return;
    }

    setError(undefined);
    setSaving(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error(t('profile.authMissing', { defaultValue: 'Pengguna tidak ditemukan.' }));
      }

      let photoUrl = profile?.photoUrl;
      if (localPhotoUri) {
        photoUrl = await uploadProfileImage(currentUser.uid, localPhotoUri);
      }

      if (trimmedEmail !== currentUser.email) {
        await updateEmail(currentUser, trimmedEmail);
      }

      const needsProfileUpdate = trimmedName !== currentUser.displayName || photoUrl !== currentUser.photoURL;
      if (needsProfileUpdate) {
        await updateProfile(currentUser, { displayName: trimmedName, photoURL: photoUrl ?? null });
      }

      await upsertUserProfile(currentUser.uid, { name: trimmedName, email: trimmedEmail, photoUrl });
      setProfile({ id: currentUser.uid, name: trimmedName, email: trimmedEmail, photoUrl: photoUrl ?? undefined });

      Alert.alert(t('profile.saveSuccessTitle', { defaultValue: 'Berhasil' }), t('profile.saveSuccessMessage', { defaultValue: 'Profil berhasil diperbarui.' }), [
        {
          text: t('common.ok', { defaultValue: 'OK' }),
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        setError(t('profile.reauthRequired', { defaultValue: 'Silakan masuk kembali untuk memperbarui email.' }));
      } else {
        const message = err?.message ?? t('profile.saveErrorMessage', { defaultValue: 'Terjadi kesalahan saat menyimpan profil.' });
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  }, [email, localPhotoUri, name, navigation, profile?.photoUrl, setProfile, t]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
      <View style={{ alignItems: 'center', gap: 12 }}>
        {currentPhoto ? <Avatar.Image size={120} source={{ uri: currentPhoto }} /> : <Avatar.Text size={120} label={profile?.name?.slice(0, 2).toUpperCase() ?? 'RJ'} />}
        <Button mode="outlined" onPress={requestImage} disabled={saving}>
          {t('profile.changePhoto', { defaultValue: 'Ubah Foto' })}
        </Button>
      </View>

      <View style={{ gap: 16 }}>
        <View>
          <TextInput
            label={t('profile.nameLabel', { defaultValue: 'Nama Lengkap' })}
            value={name}
            onChangeText={text => {
              setName(text);
              setError(undefined);
            }}
            autoCapitalize="words"
            disabled={saving}
          />
        </View>
        <View>
          <TextInput
            label={t('profile.emailLabel', { defaultValue: 'Email' })}
            value={email}
            onChangeText={text => {
              setEmail(text);
              setError(undefined);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            disabled={saving}
          />
        </View>
      </View>

      {error ? <HelperText type="error" visible>{error}</HelperText> : null}

      <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving}>
        {t('profile.saveButton', { defaultValue: 'Simpan Perubahan' })}
      </Button>

      <Button mode="outlined" onPress={() => Alert.alert(t('profile.changePasswordTitle', { defaultValue: 'Segera Hadir' }), t('profile.comingSoonMessage', { defaultValue: 'Fitur ini sedang dalam pengembangan.' }))} disabled={saving}>
        {t('profile.changePassword', { defaultValue: 'Ubah Password' })}
      </Button>
    </ScrollView>
  );
}
