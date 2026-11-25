import { it, expect } from 'vitest';
import { translate } from './i18n';
it('selects Indonesian and English with Indonesian fallback', () => { expect(translate('home', 'id')).toBe('Beranda'); expect(translate('home', 'en')).toBe('Home'); expect(translate('home', 'fr')).toBe('Beranda'); });
