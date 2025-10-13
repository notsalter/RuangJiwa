import React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Avatar, Button, Card, List, Text } from 'react-native-paper';
import { logout } from '@/services/auth';
import { useAuth } from '@/store/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/navigation/types';
import { useTranslation } from 'react-i18next';

type ProfileHomeProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

export default function ProfileHome({ navigation }: ProfileHomeProps) {
  const profile = useAuth(state => state.profile);
  const { t } = useTranslation('common');

  const name = profile?.name || t('profile.defaultName', { defaultValue: 'Pengguna RuangJiwa' });
  const email = profile?.email || t('profile.defaultEmailPlaceholder', { defaultValue: 'Email belum tersedia' });
  const photoUrl = profile?.photoUrl;

  const initials = React.useMemo(() => {
    if (name && name.trim().length > 0) {
      return name
        .split(' ')
  .filter((part: string) => part.length > 0)
  .slice(0, 2)
  .map((part: string) => part[0])
        .join('')
        .toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'RJ';
  }, [name, email]);

  const showComingSoon = React.useCallback(() => {
    Alert.alert(
      t('profile.comingSoonTitle', { defaultValue: 'Segera Hadir' }),
      t('profile.comingSoonMessage', { defaultValue: 'Fitur ini sedang dalam pengembangan.' })
    );
  }, [t]);

  const confirmLogout = React.useCallback(() => {
    Alert.alert(
      t('profile.logoutTitle', { defaultValue: 'Keluar' }),
      t('profile.logoutConfirm', { defaultValue: 'Apakah kamu yakin ingin keluar?' }),
      [
        { text: t('common.cancel', { defaultValue: 'Batal' }), style: 'cancel' },
        {
          text: t('common.yes', { defaultValue: 'Ya' }),
          style: 'destructive',
          onPress: () => {
            logout().catch(() => {
              Alert.alert(t('profile.logoutErrorTitle', { defaultValue: 'Ups!' }), t('profile.logoutErrorMessage', { defaultValue: 'Gagal keluar. Coba lagi.' }));
            });
          },
        },
      ]
    );
  }, [t]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card style={{ marginBottom: 24 }}>
        <Card.Content style={{ alignItems: 'center', gap: 12 }}>
          {photoUrl ? (
            <Avatar.Image size={96} source={{ uri: photoUrl }} />
          ) : (
            <Avatar.Text size={96} label={initials} />
          )}
          <View style={{ alignItems: 'center' }}>
            <Text variant="titleLarge">{name}</Text>
            <Text variant="bodyMedium" style={{ color: '#666' }}>{email}</Text>
          </View>
          <Button mode="contained" onPress={() => navigation.navigate('ProfileEdit')}>
            {t('profile.editProfile', { defaultValue: 'Edit Profil' })}
          </Button>
        </Card.Content>
      </Card>

      <List.Section>
        <List.Subheader>{t('profile.settingsSection', { defaultValue: 'Pengaturan' })}</List.Subheader>
        <List.Item
          title={t('profile.accountSettings', { defaultValue: 'Pengaturan Akun' })}
          description={t('profile.accountSettingsDescription', { defaultValue: 'Kelola informasi akun kamu' })}
          left={props => <List.Icon {...props} icon="account" />}
          onPress={() => navigation.navigate('ProfileEdit')}
        />
        <List.Item
          title={t('profile.notificationSettings', { defaultValue: 'Pengaturan Notifikasi' })}
          description={t('profile.comingSoonLabel', { defaultValue: 'Segera hadir' })}
          left={props => <List.Icon {...props} icon="bell" />}
          onPress={showComingSoon}
        />
        <List.Item
          title={t('profile.privacySettings', { defaultValue: 'Privasi' })}
          description={t('profile.comingSoonLabel', { defaultValue: 'Segera hadir' })}
          left={props => <List.Icon {...props} icon="shield-lock" />}
          onPress={showComingSoon}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>{t('profile.supportSection', { defaultValue: 'Layanan' })}</List.Subheader>
        <List.Item
          title={t('profile.subscription', { defaultValue: 'Langganan Premium' })}
          description={t('profile.comingSoonLabel', { defaultValue: 'Segera hadir' })}
          left={props => <List.Icon {...props} icon="crown" />}
          onPress={showComingSoon}
        />
        <List.Item
          title={t('profile.transactionHistory', { defaultValue: 'Riwayat Transaksi' })}
          description={t('profile.comingSoonLabel', { defaultValue: 'Segera hadir' })}
          left={props => <List.Icon {...props} icon="receipt" />}
          onPress={showComingSoon}
        />
        <List.Item
          title={t('profile.helpSupport', { defaultValue: 'Bantuan & Dukungan' })}
          description={t('profile.comingSoonLabel', { defaultValue: 'Segera hadir' })}
          left={props => <List.Icon {...props} icon="lifebuoy" />}
          onPress={showComingSoon}
        />
        <List.Item
          title={t('profile.termsConditions', { defaultValue: 'Syarat & Ketentuan' })}
          description={t('profile.comingSoonLabel', { defaultValue: 'Segera hadir' })}
          left={props => <List.Icon {...props} icon="file-document" />}
          onPress={showComingSoon}
        />
      </List.Section>

      <Button mode="outlined" onPress={confirmLogout} style={{ marginTop: 24 }}>
        {t('profile.logout', { defaultValue: 'Keluar' })}
      </Button>
    </ScrollView>
  );
}
