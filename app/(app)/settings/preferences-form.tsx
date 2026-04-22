'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { COUNTRIES } from '@/lib/countries';
import { updatePreferencesAction, type ActionResult } from '@/server/actions/settings';
import { cn, globalError } from '@/lib/utils';
import * as React from 'react';

type Props = {
  locale: 'fr' | 'en';
  primaryCurrency: 'XOF' | 'NGN' | 'GHS';
  countryCode: string;
  theme: 'system' | 'light' | 'dark';
};

const initial: ActionResult | undefined = undefined;

export function PreferencesForm({ locale, primaryCurrency, countryCode, theme }: Props) {
  const t = useTranslations('settings.preferences');
  const router = useRouter();
  const [state, action, pending] = useActionState(updatePreferencesAction, initial);
  const [selectedTheme, setSelectedTheme] = React.useState(theme);
  const [selectedLocale, setSelectedLocale] = React.useState(locale);
  const [selectedCurrency, setSelectedCurrency] = React.useState(primaryCurrency);
  const [selectedCountry, setSelectedCountry] = React.useState(countryCode);

  React.useEffect(() => {
    if (state?.ok) {
      router.refresh();
      // Applique immédiatement le thème côté client.
      if (selectedTheme === 'light' || selectedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', selectedTheme);
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
  }, [state, selectedTheme, router]);

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* Langue */}
      <div>
        <p className="mb-2 text-sm text-foreground">{t('language')}</p>
        <div className="flex gap-2">
          {(['fr', 'en'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSelectedLocale(v)}
              aria-pressed={selectedLocale === v}
              className={cn(
                'rounded-[10px] border px-4 py-2 text-sm transition-colors',
                selectedLocale === v
                  ? 'border-[color:var(--forest)] bg-[color:var(--surface)]'
                  : 'border-border text-muted-foreground hover:bg-[color:var(--surface)]',
              )}
            >
              {v === 'fr' ? 'Français' : 'English'}
            </button>
          ))}
        </div>
        <input type="hidden" name="locale" value={selectedLocale} />
      </div>

      {/* Pays */}
      <div>
        <p className="mb-2 text-sm text-foreground">{t('country')}</p>
        <select
          name="countryCode"
          value={selectedCountry}
          onChange={(e) => {
            setSelectedCountry(e.target.value);
            const country = COUNTRIES.find((c) => c.code === e.target.value);
            if (country) setSelectedCurrency(country.currency as typeof selectedCurrency);
          }}
          className="h-11 w-full max-w-xs rounded-[10px] border border-border bg-background px-3 text-base text-foreground"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Devise */}
      <div>
        <p className="mb-2 text-sm text-foreground">{t('currency')}</p>
        <div className="flex gap-2">
          {(['XOF', 'NGN', 'GHS'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSelectedCurrency(v)}
              aria-pressed={selectedCurrency === v}
              className={cn(
                'rounded-[10px] border px-4 py-2 text-sm font-mono transition-colors',
                selectedCurrency === v
                  ? 'border-[color:var(--forest)] bg-[color:var(--surface)]'
                  : 'border-border text-muted-foreground hover:bg-[color:var(--surface)]',
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <input type="hidden" name="primaryCurrency" value={selectedCurrency} />
      </div>

      {/* Thème */}
      <div>
        <p className="mb-2 text-sm text-foreground">{t('theme')}</p>
        <div className="flex gap-2">
          {(['system', 'light', 'dark'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSelectedTheme(v)}
              aria-pressed={selectedTheme === v}
              className={cn(
                'rounded-[10px] border px-4 py-2 text-sm transition-colors',
                selectedTheme === v
                  ? 'border-[color:var(--forest)] bg-[color:var(--surface)]'
                  : 'border-border text-muted-foreground hover:bg-[color:var(--surface)]',
              )}
            >
              {t(`themes.${v}`)}
            </button>
          ))}
        </div>
        <input type="hidden" name="theme" value={selectedTheme} />
      </div>

      {state?.ok ? <p className="text-xs text-[color:var(--forest)]">{state.message}</p> : null}
      {globalError(state) ? <p className="text-xs text-[color:var(--terracotta)]">{globalError(state)}</p> : null}

      <Button type="submit" size="md" disabled={pending} className="self-start">
        {pending ? t('saving') : t('save')}
      </Button>
    </form>
  );
}
