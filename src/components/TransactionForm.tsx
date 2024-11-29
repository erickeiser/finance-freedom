import React, { useState } from 'react';
import { format } from 'date-fns';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction, BudgetRuleCategory } from '../types';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import toast from 'react-hot-toast';

interface TransactionFormProps {
  type: 'income' | 'expense';
  categories: string[];
  onSuccess: () => void;
  incomes: Transaction[];
}

const labelClasses = "block text-sm font-medium text-gray-700 mb-2";
const inputClasses = "w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-900 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:bg-white";

const budgetCategories: { value: BudgetRuleCategory; label: string; description: string }[] = [
  { value: 'needs', label: 'Needs (50%)', description: 'Essential expenses like housing, utilities, groceries' },
  { value: 'wants', label: 'Wants (30%)', description: 'Non-essential items like entertainment, dining out' },
  { value: 'savings', label: 'Savings (20%)', description: 'Savings, investments, debt repayment' },
];

export default function TransactionForm({ type, categories, onSuccess, incomes }: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0] || '');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedIncomeId, setSelectedIncomeId] = useState('');
  const [funded, setFunded] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState<BudgetRuleCategory>('needs');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const transaction = {
        amount: parseFloat(amount),
        description,
        category,
        type,
        date: selectedDate,
        funded: type === 'income' ? false : funded,
        ...(type === 'income' && { receivedAmount: 0 }),
        ...(type === 'expense' && { 
          linkedIncomeId: selectedIncomeId,
          budgetCategory 
        }),
      };

      await addDoc(collection(db, 'transactions'), transaction);
      
      setAmount('');
      setDescription('');
      setCategory(categories[0] || '');
      setSelectedDate(new Date());
      setSelectedIncomeId('');
      setFunded(false);
      setBudgetCategory('needs');
      onSuccess();
      toast.success(`${type} added successfully!`);
    } catch (error) {
      toast.error('Failed to add transaction');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="amount" className={labelClasses}>Amount</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-gray-500">$</span>
          </div>
          <input
            type="number"
            id="amount"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClasses} pl-8 ${
              type === 'income'
                ? 'focus:ring-green-500 hover:bg-green-50/50'
                : 'focus:ring-red-500 hover:bg-red-50/50'
            }`}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClasses}>Description</label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputClasses} ${
            type === 'income'
              ? 'focus:ring-green-500 hover:bg-green-50/50'
              : 'focus:ring-red-500 hover:bg-red-50/50'
          }`}
          placeholder={`Enter ${type} description`}
          required
        />
      </div>

      <div>
        <label className={labelClasses}>Category</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                category === cat
                  ? type === 'income'
                    ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
                    : 'bg-red-100 text-red-700 ring-1 ring-red-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {type === 'expense' && (
        <div>
          <label className={labelClasses}>Budget Rule Category</label>
          <div className="mt-2 space-y-2">
            {budgetCategories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setBudgetCategory(cat.value)}
                className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                  budgetCategory === cat.value
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{cat.label}</span>
                  <span className="text-sm opacity-75">{cat.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="date" className={labelClasses}>Date</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date: Date) => setSelectedDate(date)}
          className={`${inputClasses} ${
            type === 'income'
              ? 'focus:ring-green-500 hover:bg-green-50/50'
              : 'focus:ring-red-500 hover:bg-red-50/50'
          }`}
          dateFormat="MMMM d, yyyy"
          placeholderText="Select date"
          required
        />
      </div>

      {type === 'expense' && incomes.length > 0 && (
        <div>
          <label htmlFor="income" className={labelClasses}>Allocate to Income</label>
          <select
            id="income"
            value={selectedIncomeId}
            onChange={(e) => setSelectedIncomeId(e.target.value)}
            className={`${inputClasses} ${
              type === 'income'
                ? 'focus:ring-green-500 hover:bg-green-50/50'
                : 'focus:ring-red-500 hover:bg-red-50/50'
            }`}
            required
          >
            <option value="">Select an income source</option>
            {incomes.map((income) => (
              <option key={income.id} value={income.id}>
                {income.description} - ${income.amount} ({format(income.date, 'MMM d, yyyy')})
              </option>
            ))}
          </select>
        </div>
      )}

      {type === 'expense' && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="funded"
            checked={funded}
            onChange={(e) => setFunded(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="funded" className="ml-2 block text-sm text-gray-700">
            Already paid
          </label>
        </div>
      )}

      <button
        type="submit"
        className={`w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${
          type === 'income'
            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        } focus:outline-none focus:ring-2 focus:ring-offset-2`}
      >
        Add {type}
      </button>
    </form>
  );
}