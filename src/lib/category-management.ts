export type CategoryUsageCounts = {
  transactions: number;
  incomes: number;
  expenses: number;
  bills: number;
  budgets: number;
};

export const CATEGORY_IN_USE_MESSAGE =
  "This category is currently used by existing records. Reassign or remove those records before deleting it.";

export function categoryUsageTotal(counts: CategoryUsageCounts) {
  return counts.transactions + counts.incomes + counts.expenses + counts.bills + counts.budgets;
}

export function categoryDeletionBlockReason(counts: CategoryUsageCounts) {
  return categoryUsageTotal(counts) > 0 ? CATEGORY_IN_USE_MESSAGE : null;
}
