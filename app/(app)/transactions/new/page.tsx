import { redirect } from 'next/navigation';
import { requireOnboardedUser } from '@/lib/auth/session';
import {
  activeAccountsForUser,
  topCategoriesForUser,
  userCategories,
} from '@/lib/db/queries/transactions';
import { prisma } from '@/lib/db/client';
import { getSuggestionForNow } from '@/lib/patterns';
import { EntryForm } from './entry-form';
import type { SupportedLocale } from '@/lib/money/currency';

export const dynamic = 'force-dynamic';

export default async function NewTransactionPage() {
  const user = await requireOnboardedUser();

  const [accounts, topIds, categories, suggestion, userRow] = await Promise.all([
    activeAccountsForUser(user.id),
    topCategoriesForUser(user.id, 8).then((cats) => cats.map((c) => c.id)),
    userCategories(user.id),
    getSuggestionForNow(user.id),
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { locale: true },
    }),
  ]);

  if (accounts.length === 0) redirect('/accounts/new');

  const locale: SupportedLocale = userRow.locale === 'en' ? 'en' : 'fr';

  return (
    <EntryForm
      accounts={accounts.map((a) => ({
        id: a.id,
        label: a.label,
        institution: a.institution,
        currency: a.currency,
        color: a.color,
        isBlocked: a.isBlocked,
      }))}
      categories={categories.map((c) => ({
        id: c.id,
        label: c.label,
        icon: c.icon,
        color: c.color,
      }))}
      topCategoryIds={topIds}
      suggestion={suggestion}
      locale={locale}
    />
  );
}
