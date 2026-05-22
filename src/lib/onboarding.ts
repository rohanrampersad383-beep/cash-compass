export type OnboardingRecordCounts = {
  transactions: number;
  bills: number;
  budgets: number;
  savingsGoals: number;
  uploadedStatements: number;
};

export function shouldShowOnboarding(counts: OnboardingRecordCounts) {
  return (
    counts.transactions === 0 &&
    counts.bills === 0 &&
    counts.budgets === 0 &&
    counts.savingsGoals === 0 &&
    counts.uploadedStatements === 0
  );
}
