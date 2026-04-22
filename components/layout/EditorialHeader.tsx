import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  date?: Date;
  locale?: 'fr' | 'en';
  className?: string;
};

// En-tête éditorial : titre italique bas de casse, date longue, filet ocre.
// Appliqué à chaque page de l'app (cf. §2.9).
export function EditorialHeader({ title, date = new Date(), locale = 'fr', className }: Props) {
  const dateLocale = locale === 'en' ? enUS : fr;
  const formatted =
    locale === 'fr'
      ? format(date, "EEEE d MMMM yyyy", { locale: dateLocale })
      : format(date, 'EEEE, MMMM d, yyyy', { locale: dateLocale });

  return (
    <header className={cn('pt-8 pb-6', className)}>
      <h1
        className="editorial-title text-foreground"
        style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
      >
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{formatted}</p>
      <div className="rule-ochre mt-4" />
    </header>
  );
}
