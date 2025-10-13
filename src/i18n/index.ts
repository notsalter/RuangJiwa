import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import id from './locales/id/common.json';
import en from './locales/en/common.json';

void i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    lng: Localization.locale.startsWith('id') ? 'id' : 'en',
    fallbackLng: 'en',
    resources: {
      id: { common: id },
      en: { common: en },
    },
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });

export default i18n;
