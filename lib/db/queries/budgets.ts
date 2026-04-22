import 'server-only';
import { prisma } from '@/lib/db/client';

export type BudgetWithProgress = {
  id: string | null; // null = catégorie sans budget défini
  categoryId: string;
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: string;
  strategyBucket: string;
  monthlyLimit: number;
  spent: number;
  currency: string;
  ratio: number; // spent / limit, ∈ [0, ∞)
  tone: 'calm' | 'watch' | 'over'; // calm < 70%, watch 70–90%, over ≥ 90%
  alertAt70: boolean;
  alertAt90: boolean;
  blockAt100: boolean;
};

// Renvoie pour le mois donné : toutes les catégories avec budget défini + toutes
// les catégories système utilisées mais sans budget.
export async function getBudgetsForMonth(
  userId: string,
  year: number,
  month: number, // 0-11
): Promise<BudgetWithProgress[]> {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  const [budgets, spendRows, userRow] = await Promise.all([
    prisma.budget.findMany({
      where: { userId },
      include: {
        // categoryId peut pointer vers système OU user, on récupère via findMany
      },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        kind: 'EXPENSE',
        categoryId: { not: null },
        occurredAt: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { primaryCurrency: true },
    }),
  ]);

  const currency = userRow.primaryCurrency ?? 'XOF';

  const spentByCategory = new Map<string, number>();
  for (const row of spendRows) {
    if (!row.categoryId) continue;
    spentByCategory.set(row.categoryId, Number(row._sum.amount ?? 0));
  }

  // On inclut toutes les catégories avec un budget, même sans dépense ce mois.
  const budgetedCategoryIds = budgets.map((b) => b.categoryId);
  // Et toutes les catégories avec dépenses ce mois sans budget.
  const spentCategoryIds = Array.from(spentByCategory.keys()).filter(
    (id) => !budgetedCategoryIds.includes(id),
  );
  const allCategoryIds = [...new Set([...budgetedCategoryIds, ...spentCategoryIds])];
  if (allCategoryIds.length === 0) return [];

  const categories = await prisma.category.findMany({
    where: { id: { in: allCategoryIds } },
  });
  const catById = new Map(categories.map((c) => [c.id, c]));

  const result: BudgetWithProgress[] = [];

  for (const budget of budgets) {
    const cat = catById.get(budget.categoryId);
    if (!cat) continue;
    const spent = spentByCategory.get(budget.categoryId) ?? 0;
    const limit = Number(budget.monthlyLimit);
    const ratio = limit > 0 ? spent / limit : 0;
    result.push({
      id: budget.id,
      categoryId: budget.categoryId,
      categoryLabel: cat.label,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
      strategyBucket: cat.strategyBucket,
      monthlyLimit: limit,
      spent,
      currency: budget.currency,
      ratio,
      tone: toneForRatio(ratio),
      alertAt70: budget.alertAt70,
      alertAt90: budget.alertAt90,
      blockAt100: budget.blockAt100,
    });
  }

  // Catégories dépensées sans budget — affichées en seconde section.
  for (const id of spentCategoryIds) {
    const cat = catById.get(id);
    if (!cat) continue;
    const spent = spentByCategory.get(id) ?? 0;
    result.push({
      id: null,
      categoryId: id,
      categoryLabel: cat.label,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
      strategyBucket: cat.strategyBucket,
      monthlyLimit: 0,
      spent,
      currency,
      ratio: 0,
      tone: 'calm',
      alertAt70: true,
      alertAt90: true,
      blockAt100: false,
    });
  }

  // Tri : catégories avec budget d'abord (les plus proches du plafond en haut).
  result.sort((a, b) => {
    if ((a.id === null) !== (b.id === null)) return a.id === null ? 1 : -1;
    return b.ratio - a.ratio;
  });

  return result;
}

function toneForRatio(ratio: number): BudgetWithProgress['tone'] {
  if (ratio >= 0.9) return 'over';
  if (ratio >= 0.7) return 'watch';
  return 'calm';
}

export async function budgetableCategories(userId: string) {
  return prisma.category.findMany({
    where: { OR: [{ isSystem: true }, { userId }] },
    orderBy: [{ strategyBucket: 'asc' }, { label: 'asc' }],
  });
}
