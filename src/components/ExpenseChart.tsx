import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { Transaction } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ExpenseChartProps {
  transactions: Transaction[];
}

export default function ExpenseChart({ transactions }: ExpenseChartProps) {
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense' && t.funded)
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const totalExpenses = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);

  const data = {
    labels: Object.keys(expensesByCategory).map(category => {
      const amount = expensesByCategory[category];
      const percentage = ((amount / totalExpenses) * 100).toFixed(1);
      return `${category} (${percentage}%)`;
    }),
    datasets: [
      {
        data: Object.values(expensesByCategory),
        backgroundColor: [
          '#3B82F6', // blue
          '#10B981', // green
          '#F59E0B', // yellow
          '#EF4444', // red
          '#8B5CF6', // purple
          '#EC4899', // pink
          '#6366F1', // indigo
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `$${value.toFixed(2)} (${percentage}%)`;
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Funded Expense Distribution</h3>
      <div className="h-[300px]">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
}