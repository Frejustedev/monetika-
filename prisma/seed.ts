import { PrismaClient, AccountKind, StrategyBucket, TransactionKind } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed: démarrage');

  // Utilisateur démo (Koffi, Bénin)
  const pinHash = await bcrypt.hash('000000', 10);
  const user = await prisma.user.upsert({
    where: { email: 'koffi@monetika.demo' },
    update: {},
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
    },
  });

  await prisma.strategyConfig.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  // 4 comptes
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

  for (const c of comptes) {
    await prisma.account.create({
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
    });
  }

  // TODO Phase 1/2 — 60 transactions réalistes sur 90 j (loyer, carburant, courses, resto, transfert, salaire)
  // TODO Phase 1/2 — budgets, objectifs cohérents

  console.log(`Seed: utilisateur ${user.email} + 4 comptes créés`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
