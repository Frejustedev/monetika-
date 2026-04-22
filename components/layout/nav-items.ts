// Source unique des items de navigation.
// i18n : les labels sont résolus dans les composants via next-intl.

export type NavItem = {
  key: 'home' | 'accounts' | 'add' | 'insights' | 'more';
  href: string;
  accent?: boolean; // item central "Ajouter" — primé en forest
};

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', href: '/dashboard' },
  { key: 'accounts', href: '/accounts' },
  { key: 'add', href: '/transactions/new', accent: true },
  { key: 'insights', href: '/insights' },
  { key: 'more', href: '/settings' },
];
