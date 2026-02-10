export default ({ config }: any) => ({
  ...(config || {}),
  name: 'RuangJiwa',
  slug: 'ruangjiwa',
  scheme: 'ruangjiwa',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  android: {
    package: 'com.ruangjiwa.app',
    permissions: ['NOTIFICATIONS']
  },
  plugins: [
    'expo-notifications'
  ],
  extra: {
    EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
  }
});
