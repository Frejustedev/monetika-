import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { StepProgress, type StepKey } from '@/components/onboarding/StepProgress';
import { getOnboardingState } from '@/server/actions/onboarding';
import { PersonalStep } from './_steps/personal';
import { CountryStep } from './_steps/country';
import { PrivacyStep } from './_steps/privacy';
import { PinStep } from './_steps/pin';
import { StrategyStep } from './_steps/strategy';
import { FirstAccountStep } from './_steps/first-account';
import { WelcomeStep } from './_steps/welcome';

const STEPS: readonly StepKey[] = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Onboarding dépend de la session → rendu dynamique systématique,
// pas de SSG (sinon Next.js essaie de pré-rendre sans cookies et la page sort blanche).
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ step: string }> };

export default async function OnboardingStepPage({ params }: Props) {
  const { step } = await params;
  const stepKey = step.toUpperCase() as StepKey;
  if (!STEPS.includes(stepKey)) notFound();

  const t = await getTranslations('onboarding');
  const state = await getOnboardingState();
  const user = state.user;
  if (!user) redirect('/login');
  if (user.onboardedAt && stepKey !== 'VII') redirect('/');

  return (
    <section>
      <StepProgress current={stepKey} />
      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        {t(`steps.${stepKey}.overline`)}
      </p>
      <h1
        className="mt-3 font-display font-medium leading-[1.05] tracking-[-0.02em]"
        style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)' }}
      >
        {t(`steps.${stepKey}.title`)}
      </h1>
      <p className="mt-4 max-w-lg text-base leading-[1.65] text-muted-foreground">
        {t(`steps.${stepKey}.lede`)}
      </p>
      <div className="rule-ochre mt-6" />

      <div className="mt-8">
        {stepKey === 'I' && <PersonalStep user={user} />}
        {stepKey === 'II' && <CountryStep user={user} />}
        {stepKey === 'III' && <PrivacyStep />}
        {stepKey === 'IV' && <PinStep hasPin={Boolean(user.pinHash)} />}
        {stepKey === 'V' && <StrategyStep locale={(user.locale as 'fr' | 'en') ?? 'fr'} initial={state.user?.strategyConfig ?? undefined} />}
        {stepKey === 'VI' && <FirstAccountStep countryCode={user.countryCode ?? 'BJ'} hasAccount={user.accounts.length > 0} />}
        {stepKey === 'VII' && <WelcomeStep firstName={user.firstName ?? null} />}
      </div>

      {stepKey !== 'I' ? (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href={`/onboarding/${STEPS[STEPS.indexOf(stepKey) - 1]}`}
            className="inline-flex items-center gap-2 hover:text-foreground"
          >
            <span className="font-display italic" aria-hidden>
              ←
            </span>
            {t('back')}
          </Link>
        </div>
      ) : null}
    </section>
  );
}

// generateStaticParams retiré : dynamic = 'force-dynamic' suffit à couvrir les 7 steps.
