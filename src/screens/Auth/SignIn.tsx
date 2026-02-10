import React from 'react';
import { View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { emailSignIn } from '@/services/auth';

export default function SignIn({ navigation }: any) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
      <Text variant="headlineMedium">Masuk</Text>
      <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" style={{ marginVertical: 8 }} />
      <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry style={{ marginVertical: 8 }} />
      {error ? <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text> : null}
      <Button mode="contained" loading={loading} disabled={loading} onPress={async () => {
        setError(undefined);
        setLoading(true);
        try {
          await emailSignIn(email.trim(), password);
        } catch (e: any) {
          setError(e?.message || 'Gagal masuk');
        } finally {
          setLoading(false);
        }
      }}>
        Sign In
      </Button>
      <Button style={{ marginTop: 8 }} onPress={() => navigation.navigate('Register')}>Belum punya akun? Daftar</Button>
    </View>
  );
}
