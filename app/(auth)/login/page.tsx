import { getTranslations } from 'next-intl/server';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const t = await getTranslations('auth.login');
  return (
    <section>
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        {t('overline')}
      </p>
      <h1
        className="mt-4 font-display font-medium leading-[1.05] tracking-[-0.02em]"
        style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
      >
        {t('title')}
      </h1>
      <p className="mt-4 max-w-md text-base leading-[1.65] text-muted-foreground">{t('lede')}</p>
      <div className="rule-ochre mt-6" />

      <LoginForm />
    </section>
  );
}
