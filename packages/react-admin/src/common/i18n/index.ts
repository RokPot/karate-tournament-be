import polyglotI18nProvider from 'ra-i18n-polyglot';
import { I18nProvider, TranslationMessages } from 'react-admin';

import { deepMerge } from '~common/utils/deep-merge';

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type TranslationPartial = Record<string, DeepPartial<TranslationMessages>>;

export function composableI18nProvider(partials: TranslationPartial[]): I18nProvider {
  const messages = deepMerge(...partials);
  return polyglotI18nProvider((locale) => (locale in messages ? messages[locale] : messages.en), 'en', [
    { locale: 'en', name: 'English' },
  ]);
}
