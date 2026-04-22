import {
  PrismaClient,
  AccountKind,
  StrategyBucket,
  TransactionKind,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// —— Catégories système ——
const SYSTEM_CATEGORIES = [
  { key: 'rent', label: 'Loyer', icon: 'house', color: '#1F4D3F', bucket: StrategyBucket.NECESSITIES },
  { key: 'groceries', label: 'Courses', icon: 'basket', color: '#5B7A5E', bucket: StrategyBucket.NECESSITIES },
  { key: 'fuel', label: 'Carburant', icon: 'fuel', color: '#8B4A2B', bucket: StrategyBucket.NECESSITIES },
  { key: 'transport', label: 'Transport', icon: 'car', color: '#4A6B8A', bucket: StrategyBucket.NECESSITIES },
  { key: 'restaurant', label: 'Restaurant', icon: 'knife', color: '#C89A3C', bucket: StrategyBucket.JOY },
  { key: 'utilities', label: 'Électricité · eau', icon: 'lightning', color: '#5B7A5E', bucket: StrategyBucket.NECESSITIES },
  { key: 'telecom', label: 'Téléphone · internet', icon: 'phone', color: '#4A6B8A', bucket: StrategyBucket.NECESSITIES },
  { key: 'health', label: 'Santé', icon: 'heartbeat', color: '#B8552D', bucket: StrategyBucket.EMERGENCY },
  { key: 'school', label: 'Scolarité', icon: 'book', color: '#C89A3C', bucket: StrategyBucket.EDUCATION },
  { key: 'clothes', label: 'Habillement', icon: 'tshirt', color: '#8B4A2B', bucket: StrategyBucket.JOY },
  { key: 'family', label: 'Aide familiale', icon: 'users', color: '#5B7A5E', bucket: StrategyBucket.GIVE },
  { key: 'tontine', label: 'Tontine', icon: 'coins', color: '#C89A3C', bucket: StrategyBucket.INVESTMENT },
  { key: 'subscriptions', label: 'Abonnements', icon: 'repeat', color: '#4A6B8A', bucket: StrategyBucket.JOY },
  { key: 'ceremony', label: 'Cérémonies', icon: 'gift', color: '#B8552D', bucket: StrategyBucket.GIVE },
  { key: 'salary', label: 'Salaire', icon: 'briefcase', color: '#1F4D3F', bucket: StrategyBucket.NECESSITIES },
  { key: 'freelance', label: 'Activité secondaire', icon: 'laptop', color: '#4A6B8A', bucket: StrategyBucket.NECESSITIES },
  { key: 'remittance', label: 'Transfert reçu', icon: 'arrow-down', color: '#5B7A5E', bucket: StrategyBucket.NECESSITIES },
  { key: 'dividends', label: 'Dividendes', icon: 'chart', color: '#8B4A2B', bucket: StrategyBucket.INVESTMENT },
];

async function main() {
  console.log('Seed: démarrage');

  // 1. Utilisateur démo
  const pinHash = await bcrypt.hash('483726', 10);
  const user = await prisma.user.upsert({
    where: { email: 'koffi@monetika.demo' },
    update: { pinHash },
    create: {
      email: 'koffi@monetika.demo',
      firstName: 'Koffi',
      lastName: 'Agbodjan',
      phone: '+22997000000',
      countryCode: 'BJ',
      primaryCurrency: 'XOF',
      locale: 'fr',
      pinHash,
      timezone: 'Africa/Porto-Novo',
      onboardedAt: new Date(),
    },
  });

  await prisma.strategyConfig.upsert({
    where: { userId: user.id },
    update: { necessities: 55, emergency: 15, education: 10, investment: 10, joy: 5, give: 5 },
    create: { userId: user.id, necessities: 55, emergency: 15, education: 10, investment: 10, joy: 5, give: 5 },
  });

  // 2. Catégories
  await prisma.category.deleteMany({ where: { userId: user.id } });
  await prisma.category.deleteMany({ where: { userId: null, isSystem: true } });
  await prisma.category.createMany({
    data: SYSTEM_CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      icon: c.icon,
      color: c.color,
      strategyBucket: c.bucket,
      isSystem: true,
    })),
    skipDuplicates: true,
  });
  const categories = await prisma.category.findMany({ where: { isSystem: true } });
  const catByKey = new Map(categories.map((c) => [c.key, c]));

  // 3. Comptes (purger puis recréer pour idempotence)
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.account.deleteMany({ where: { userId: user.id } });

  const comptes = [
    {
      label: 'Compte courant',
      institution: 'Bank of Africa',
      kind: AccountKind.BANK_CHECKING,
      balance: 1_245_000,
      color: '#1F4D3F',
      icon: 'bank',
      bucket: StrategyBucket.NECESSITIES,
    },
    {
      label: 'MoMo',
      institution: 'MTN Mobile Money',
      kind: AccountKind.MOBILE_MONEY,
      balance: 85_400,
      color: '#C89A3C',
      icon: 'phone',
      bucket: StrategyBucket.JOY,
    },
    {
      label: 'Épargne urgence',
      institution: 'Ecobank',
      kind: AccountKind.BANK_SAVINGS,
      balance: 600_000,
      color: '#5B7A5E',
      icon: 'shield',
      bucket: StrategyBucket.EMERGENCY,
    },
    {
      label: 'Titres BRVM',
      institution: 'SGI Atlantique',
      kind: AccountKind.SECURITIES,
      balance: 950_000,
      color: '#4A6B8A',
      icon: 'chart',
      bucket: StrategyBucket.INVESTMENT,
    },
  ];

  const createdAccounts = await Promise.all(
    comptes.map((c) =>
      prisma.account.create({
        data: {
          userId: user.id,
          label: c.label,
          institution: c.institution,
          kind: c.kind,
          currency: 'XOF',
          currentBalance: c.balance,
          color: c.color,
          icon: c.icon,
          strategyBucket: c.bucket,
        },
      }),
    ),
  );

  const [compte, momo, epargne, _titres] = createdAccounts;
  if (!compte || !momo || !epargne || !_titres) throw new Error('seed: comptes manquants');

  // 4. Transactions réalistes sur 90 j (~60+ entrées)
  const now = new Date();
  const tx: Array<{
    accountId: string;
    kind: TransactionKind;
    amount: number;
    occurredAt: Date;
    categoryKey?: string;
    merchant?: string;
    note?: string;
    strategyBucket?: StrategyBucket;
  }> = [];

  // Salaires mensuels sur compte courant (3 derniers mois)
  for (let m = 0; m < 3; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 28);
    tx.push({
      accountId: compte.id,
      kind: TransactionKind.INCOME,
      amount: 825_000,
      occurredAt: d,
      categoryKey: 'salary',
      merchant: 'Employeur SARL',
      strategyBucket: StrategyBucket.NECESSITIES,
    });
  }

  // Loyer mensuel
  for (let m = 0; m < 3; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 5);
    tx.push({
      accountId: compte.id,
      kind: TransactionKind.EXPENSE,
      amount: 180_000,
      occurredAt: d,
      categoryKey: 'rent',
      merchant: 'Propriétaire',
    });
  }

  // Électricité + internet
  for (let m = 0; m < 3; m++) {
    const d1 = new Date(now.getFullYear(), now.getMonth() - m, 12);
    const d2 = new Date(now.getFullYear(), now.getMonth() - m, 14);
    tx.push({
      accountId: compte.id,
      kind: TransactionKind.EXPENSE,
      amount: 34_000 + Math.floor(Math.random() * 4_000),
      occurredAt: d1,
      categoryKey: 'utilities',
      merchant: 'SBEE',
    });
    tx.push({
      accountId: momo.id,
      kind: TransactionKind.EXPENSE,
      amount: 15_000,
      occurredAt: d2,
      categoryKey: 'telecom',
      merchant: 'MTN Internet',
    });
  }

  // Courses hebdo (samedi)
  for (let w = 0; w < 12; w++) {
    const d = new Date(now);
    d.setDate(now.getDate() - w * 7 - (now.getDay() === 6 ? 0 : 6 - now.getDay()));
    tx.push({
      accountId: compte.id,
      kind: TransactionKind.EXPENSE,
      amount: 22_000 + Math.floor(Math.random() * 12_000),
      occurredAt: d,
      categoryKey: 'groceries',
      merchant: 'Erevan',
    });
  }

  // Carburant ~2x/semaine
  for (let w = 0; w < 12; w++) {
    for (const offset of [2, 5]) {
      const d = new Date(now);
      d.setDate(now.getDate() - w * 7 - offset);
      tx.push({
        accountId: momo.id,
        kind: TransactionKind.EXPENSE,
        amount: 5_000 + Math.floor(Math.random() * 3_000),
        occurredAt: d,
        categoryKey: 'fuel',
        merchant: 'Total Energies',
      });
    }
  }

  // Restaurants — plus fréquents en mois courant (pour générer un insight)
  const restoSeedsCurrent = 8;
  const restoSeedsLast = 5;
  for (let i = 0; i < restoSeedsCurrent; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - Math.floor(Math.random() * 28));
    tx.push({
      accountId: momo.id,
      kind: TransactionKind.EXPENSE,
      amount: 4_500 + Math.floor(Math.random() * 9_000),
      occurredAt: d,
      categoryKey: 'restaurant',
      merchant: ['Chez Tantie', 'Le Brésilien', 'Nkwaa'][i % 3],
    });
  }
  for (let i = 0; i < restoSeedsLast; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 3 + Math.floor(Math.random() * 24));
    tx.push({
      accountId: momo.id,
      kind: TransactionKind.EXPENSE,
      amount: 4_500 + Math.floor(Math.random() * 9_000),
      occurredAt: d,
      categoryKey: 'restaurant',
    });
  }

  // Transferts reçus famille
  for (let m = 0; m < 3; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 20);
    tx.push({
      accountId: momo.id,
      kind: TransactionKind.INCOME,
      amount: 50_000,
      occurredAt: d,
      categoryKey: 'remittance',
      merchant: 'Frère Koudjo',
    });
  }

  // Tontine mensuelle
  for (let m = 0; m < 3; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 15);
    tx.push({
      accountId: compte.id,
      kind: TransactionKind.EXPENSE,
      amount: 25_000,
      occurredAt: d,
      categoryKey: 'tontine',
      merchant: 'Tontine du quartier',
    });
  }

  // Cérémonies ponctuelles
  tx.push({
    accountId: compte.id,
    kind: TransactionKind.EXPENSE,
    amount: 80_000,
    occurredAt: new Date(now.getFullYear(), now.getMonth() - 1, 22),
    categoryKey: 'ceremony',
    merchant: 'Baptême',
  });

  // Abonnements (Netflix, Spotify)
  for (let m = 0; m < 3; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 2);
    tx.push({
      accountId: momo.id,
      kind: TransactionKind.EXPENSE,
      amount: 3_300,
      occurredAt: d,
      categoryKey: 'subscriptions',
      merchant: 'Netflix',
    });
    tx.push({
      accountId: momo.id,
      kind: TransactionKind.EXPENSE,
      amount: 2_500,
      occurredAt: new Date(d.getTime() + 86400000),
      categoryKey: 'subscriptions',
      merchant: 'Spotify',
    });
  }

  // Activité secondaire (freelance) côté MoMo
  for (let m = 0; m < 3; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 10);
    tx.push({
      accountId: momo.id,
      kind: TransactionKind.INCOME,
      amount: 120_000,
      occurredAt: d,
      categoryKey: 'freelance',
      merchant: 'Client web',
    });
  }

  // Virement vers épargne (transfer)
  for (let m = 0; m < 3; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 29);
    tx.push({
      accountId: compte.id,
      kind: TransactionKind.TRANSFER,
      amount: 50_000,
      occurredAt: d,
      note: 'Vers Épargne urgence',
    });
  }

  // Create all
  for (const entry of tx) {
    const cat = entry.categoryKey ? catByKey.get(entry.categoryKey) : undefined;
    await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: entry.accountId,
        kind: entry.kind,
        amount: entry.amount,
        currency: 'XOF',
        occurredAt: entry.occurredAt,
        categoryId: cat?.id ?? null,
        strategyBucket: entry.strategyBucket ?? cat?.strategyBucket ?? null,
        merchant: entry.merchant ?? null,
        note: entry.note ?? null,
      },
    });
  }

  console.log(`Seed: user ${user.email} · ${createdAccounts.length} comptes · ${tx.length} transactions`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
