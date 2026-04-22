'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { TransactionKind } from '@prisma/client';
import { X } from '@phosphor-icons/react/dist/ssr';
import { AmountPad } from '@/components/transactions/AmountPad';
import { KindTabs } from '@/components/transactions/KindTabs';
import { CategoryGrid, type Category } from '@/components/transactions/CategoryGrid';
import { AccountSelector, type SelectableAccount } from '@/components/transactions/AccountSelector';
import { SuggestionLine } from '@/components/transactions/SuggestionLine';
import { Button } from '@/components/ui/button';
import { createTransactionAction, type ActionResult } from '@/server/actions/transactions';
import { CURRENCY_FRACTION_DIGITS, type SupportedCurrency, type SupportedLocale } from '@/lib/money/currency';
import { globalError } from '@/lib/utils';

type TxKind = typeof TransactionKind.EXPENSE | typeof TransactionKind.INCOME | typeof TransactionKind.TRANSFER;

type Suggestion = {
  label: string;
  amount: number;
  categoryId: string;
  accountId: string;
  frequency: number;
};

type Props = {
  accounts: SelectableAccount[];
  categories: Category[];
  topCategoryIds: string[];
  suggestion: Suggestion | null;
  locale: SupportedLocale;
};

const initial: ActionResult | undefined = undefined;

export function EntryForm({ accounts, categories, topCategoryIds, suggestion, locale }: Props) {
  const router = useRouter();
  const t = useTranslations('transactions.new');
  const [kind, setKind] = React.useState<TxKind>(TransactionKind.EXPENSE);
  const [amount, setAmount] = React.useState('');
  const [categoryId, setCategoryId] = React.useState<string | undefined>();
  const [accountId, setAccountId] = React.useState<string>(accounts[0]?.id ?? '');
  const [counterAccountId, setCounterAccountId] = React.useState<string | undefined>(accounts[1]?.id);
  const [note, setNote] = React.useState('');

  const mountedAtRef = React.useRef(typeof performance !== 'undefined' ? performance.now() : 0);

  const [state, action, pending] = React.useActionState(createTransactionAction, initial);
  const formRef = React.useRef<HTMLFormElement>(null);

  const selectedAccount = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const currency = (selectedAccount?.currency ?? 'XOF') as SupportedCurrency;
  const allowDecimals = (CURRENCY_FRACTION_DIGITS[currency] ?? 0) > 0;

  const acceptSuggestion = () => {
    if (!suggestion) return;
    setKind(TransactionKind.EXPENSE);
    setAmount(String(suggestion.amount));
    setCategoryId(suggestion.categoryId);
    setAccountId(suggestion.accountId);
    // Submit immédiat — 1 tap.
    setTimeout(() => formRef.current?.requestSubmit(), 0);
  };

  // Redirect + chrono quand le succès arrive.
  React.useEffect(() => {
    if (state?.ok) {
      const elapsed = performance.now() - mountedAtRef.current;
      if (typeof window !== 'undefined') {
        // Log perf (non bloquant, visible en dev console + analytics plus tard).
        console.info(`[monetika] tx-entry %dms`, Math.round(elapsed));
      }
      router.replace('/dashboard');
      router.refresh();
    }
  }, [state, router]);

  const close = () => {
    if (history.length > 1) router.back();
    else router.replace('/dashboard');
  };

  const disableSubmit = !amount || Number(amount) <= 0 || pending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--background)]/80 backdrop-blur-sm md:p-6">
      <div className="relative flex h-[100dvh] w-full max-w-[460px] flex-col bg-background shadow-xl md:h-auto md:max-h-[92vh] md:rounded-[20px] md:border md:border-border">
        {/* Header — handle + close */}
        <header className="flex items-center justify-between border-b border-border px-5 pt-[env(safe-area-inset-top)] pt-4 pb-3 md:px-6">
          <p className="editorial-title text-lg text-foreground">{t('title')}</p>
          <button
            type="button"
            onClick={close}
            aria-label={t('close')}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-[color:var(--surface)] hover:text-foreground"
          >
            <X size={20} weight="regular" />
          </button>
        </header>

        <form
          ref={formRef}
          action={action}
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4 md:px-6"
        >
          {/* Suggestion 1-tap si disponible */}
          {suggestion && kind === TransactionKind.EXPENSE && !amount ? (
            <SuggestionLine
              label={suggestion.label}
              amount={suggestion.amount}
              currency={currency}
              locale={locale}
              onAccept={acceptSuggestion}
            />
          ) : null}

          <KindTabs value={kind} onChange={setKind} locale={locale} />

          <AmountPad
            value={amount}
            onChange={setAmount}
            currency={currency}
            allowDecimals={allowDecimals}
            maxFractionDigits={CURRENCY_FRACTION_DIGITS[currency] ?? 0}
            onSubmit={() => formRef.current?.requestSubmit()}
          />

          {kind === TransactionKind.EXPENSE || kind === TransactionKind.INCOME ? (
            <>
              <CategoryGrid
                categories={categories}
                topIds={topCategoryIds}
                value={categoryId}
                onChange={setCategoryId}
              />
              <AccountSelector
                accounts={accounts}
                value={accountId}
                onChange={setAccountId}
                label={t('account')}
              />
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <AccountSelector
                accounts={accounts}
                value={accountId}
                onChange={setAccountId}
                label={t('from')}
                excludeId={counterAccountId}
              />
              <AccountSelector
                accounts={accounts}
                value={counterAccountId}
                onChange={setCounterAccountId}
                label={t('to')}
                excludeId={accountId}
              />
            </div>
          )}

          {/* Note optionnelle */}
          <textarea
            name="note"
            rows={1}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('notePlaceholder')}
            maxLength={280}
            className="w-full resize-none rounded-[10px] border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />

          {/* Champs cachés pour server action */}
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="amount" value={amount || '0'} />
          <input type="hidden" name="accountId" value={accountId} />
          <input type="hidden" name="categoryId" value={categoryId ?? ''} />
          {kind === TransactionKind.TRANSFER ? (
            <input type="hidden" name="counterAccountId" value={counterAccountId ?? ''} />
          ) : null}

          {globalError(state) ? (
            <p className="rounded-[10px] border border-[color:var(--terracotta)] bg-[color:var(--terracotta)]/10 px-4 py-3 text-sm text-[color:var(--terracotta)]">
              {globalError(state)}
            </p>
          ) : null}

          {/* Submit — bouton collant en bas */}
          <div className="sticky bottom-0 -mx-5 mt-auto border-t border-border bg-background px-5 py-3 md:-mx-6 md:px-6">
            <Button type="submit" size="lg" disabled={disableSubmit} className="w-full">
              {pending ? t('saving') : t('save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
