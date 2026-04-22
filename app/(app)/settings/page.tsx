import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { requireOnboardedUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { ProfileForm } from './profile-form';
import { PinChangeForm } from './pin-change-form';
import { PreferencesForm } from './preferences-form';
import { StrategyForm } from './strategy-form';
import { IncomeSourcesSection } from './income-sources';
import { DangerZone } from './danger-zone';
import { SignOutButton } from './signout-button';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await requireOnboardedUser();
  const t = await getTranslations('settings');

  const [userRow, incomeSources] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        locale: true,
        primaryCurrency: true,
        countryCode: true,
        strategyConfig: true,
      },
    }),
    prisma.incomeSource.findMany({
      where: { userId: user.id },
      // CUIDs ordonnent chronologiquement par convention.
      orderBy: { id: 'asc' },
    }),
  ]);

  const cookieStore = await cookies();
  const themePref = cookieStore.get('NEXT_THEME')?.value;
  const theme: 'system' | 'light' | 'dark' =
    themePref === 'light' || themePref === 'dark' ? themePref : 'system';

  return (
    <div className="mx-auto max-w-2xl px-5 pb-16 pt-8 md:px-10 md:pt-12">
      <header>
        <h1 className="editorial-title text-foreground" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>
        <div className="rule-ochre mt-4" />
      </header>

      <SettingsSection title={t('sections.profile')}>
        <ProfileForm
          initial={{
            firstName: userRow.firstName ?? '',
            lastName: userRow.lastName ?? '',
            email: userRow.email,
            phone: userRow.phone ?? '',
            dateOfBirth: userRow.dateOfBirth ? userRow.dateOfBirth.toISOString().slice(0, 10) : '',
          }}
        />
      </SettingsSection>

      <SettingsSection title={t('sections.security')}>
        <PinChangeForm />
        <SignOutButton />
      </SettingsSection>

      <SettingsSection title={t('sections.preferences')}>
        <PreferencesForm
          locale={(userRow.locale as 'fr' | 'en') ?? 'fr'}
          primaryCurrency={(userRow.primaryCurrency as 'XOF' | 'NGN' | 'GHS') ?? 'XOF'}
          countryCode={userRow.countryCode ?? 'BJ'}
          theme={theme}
        />
      </SettingsSection>

      <SettingsSection title={t('sections.strategy')}>
        <StrategyForm
          locale={(userRow.locale as 'fr' | 'en') ?? 'fr'}
          initial={userRow.strategyConfig ?? undefined}
        />
      </SettingsSection>

      <SettingsSection title={t('sections.income')}>
        <IncomeSourcesSection
          sources={incomeSources.map((s) => ({
            id: s.id,
            label: s.label,
            kind: s.kind,
            expectedAmount: Number(s.expectedAmount),
            currency: s.currency,
            frequency: s.frequency,
            dayOfMonth: s.dayOfMonth,
            isActive: s.isActive,
          }))}
        />
      </SettingsSection>

      <SettingsSection title={t('sections.dangerZone')}>
        <DangerZone email={userRow.email} />
      </SettingsSection>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 border-t border-border pt-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{title}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
