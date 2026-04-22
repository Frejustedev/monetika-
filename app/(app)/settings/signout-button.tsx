import { signOut } from '@/auth';
import { getTranslations } from 'next-intl/server';

export async function SignOutButton() {
  const t = await getTranslations('settings.security');
  return (
    <form
      action={async () => {
        'use server';
        await signOut({ redirectTo: '/' });
      }}
      className="mt-6 flex items-center justify-between border-t border-border pt-4"
    >
      <p className="text-sm text-muted-foreground">{t('sessionsBody')}</p>
      <button
        type="submit"
        className="rounded-[10px] border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-[color:var(--surface)]"
      >
        {t('signOut')}
      </button>
    </form>
  );
}
