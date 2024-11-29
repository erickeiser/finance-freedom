export type TransactionType = 'income' | 'expense';
export type BudgetRuleCategory = 'needs' | 'wants' | 'savings';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  budgetCategory?: BudgetRuleCategory;
  date: Date;
  type: TransactionType;
  linkedIncomeId?: string;
  receivedAmount?: number;
  funded?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  createdAt: Date;
  budgetCategory?: BudgetRuleCategory;
}