import React from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { logout } from '@/services/auth';

export default function ProfileHome() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Text variant="titleLarge">Profile</Text>
      <Text>View and edit your profile.</Text>
      <Button onPress={() => logout()} mode="outlined">Sign Out</Button>
    </View>
  );
}
