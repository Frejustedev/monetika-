'use client';

import * as React from 'react';
import {
  House,
  Basket,
  GasPump,
  Car,
  ForkKnife,
  Lightning,
  DeviceMobile,
  Heart,
  BookOpen,
  TShirt,
  UsersThree,
  Coins,
  ArrowsClockwise,
  Gift,
  Briefcase,
  Laptop,
  ArrowDown,
  ChartLine,
  Wallet,
  DotsThreeCircle,
} from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/utils';

// Mapping cohérent des icônes Phosphor utilisées par les catégories seedées.
// Toutes en variante "duotone" pour garder l'identité Monétika.
const ICONS: Record<string, React.ComponentType<{ size?: number; weight?: 'regular' | 'duotone' | 'fill' }>> = {
  house: House,
  basket: Basket,
  fuel: GasPump,
  car: Car,
  knife: ForkKnife,
  lightning: Lightning,
  phone: DeviceMobile,
  heartbeat: Heart,
  book: BookOpen,
  tshirt: TShirt,
  users: UsersThree,
  coins: Coins,
  repeat: ArrowsClockwise,
  gift: Gift,
  briefcase: Briefcase,
  laptop: Laptop,
  'arrow-down': ArrowDown,
  chart: ChartLine,
  wallet: Wallet,
  default: DotsThreeCircle,
};

export type Category = {
  id: string;
  label: string;
  icon: string;
  color: string;
};

type Props = {
  categories: Category[];
  topIds?: string[];
  value?: string;
  onChange: (id: string) => void;
};

export function CategoryGrid({ categories, topIds = [], value, onChange }: Props) {
  // Réordonne : top en premier, puis le reste par libellé.
  const ordered = React.useMemo(() => {
    const topSet = new Set(topIds);
    const top = topIds
      .map((id) => categories.find((c) => c.id === id))
      .filter((c): c is Category => Boolean(c));
    const rest = categories.filter((c) => !topSet.has(c.id));
    return [...top, ...rest];
  }, [categories, topIds]);

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {ordered.map((c) => {
        const Icon = ICONS[c.icon] ?? ICONS.default!;
        const isActive = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            aria-pressed={isActive}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-[10px] border px-2 py-3 transition-all',
              isActive
                ? 'border-[color:var(--forest)] bg-[color:var(--surface)]'
                : 'border-border text-muted-foreground hover:bg-[color:var(--surface)] hover:text-foreground',
            )}
          >
            <Icon size={22} weight={isActive ? 'duotone' : 'regular'} />
            <span className="truncate text-[11px] leading-tight">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
