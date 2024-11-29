import React, { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle, Trash2, Pencil, X, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { Transaction } from '../types';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface PaycheckCardProps {
  income: Transaction;
  linkedExpenses: Transaction[];
}

const budgetCategoryColors = {
  needs: 'bg-blue-50 text-blue-700 border-blue-200',
  wants: 'bg-purple-50 text-purple-700 border-purple-200',
  savings: 'bg-green-50 text-green-700 border-green-200',
};

const budgetCategoryLabels = {
  needs: 'Needs (50%)',
  wants: 'Wants (30%)',
  savings: 'Savings (20%)',
};

export default function PaycheckCard({ income, linkedExpenses }: PaycheckCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAmount, setEditedAmount] = useState(income.amount.toString());
  const [editedDescription, setEditedDescription] = useState(income.description);
  const [editedDate, setEditedDate] = useState(income.date);
  const [editingExpense, setEditingExpense] = useState<{
    id: string;
    description: string;
    amount: string;
  } | null>(null);
  const [showExpenses, setShowExpenses] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  const totalExpenses = linkedExpenses
    .filter(e => e.funded)
    .reduce((sum, e) => sum + e.amount, 0);

  const handleToggleReceived = async () => {
    try {
      const incomeRef = doc(db, 'transactions', income.id);
      await updateDoc(incomeRef, { 
        receivedAmount: income.receivedAmount ? 0 : income.amount,
        funded: !income.receivedAmount 
      });
      toast.success('Income status updated');
    } catch (error) {
      toast.error('Failed to update income status');
    }
  };

  const handleDelete = async () => {
    try {
      const deleteExpensePromises = linkedExpenses.map(expense => 
        deleteDoc(doc(db, 'transactions', expense.id))
      );
      await Promise.all(deleteExpensePromises);
      await deleteDoc(doc(db, 'transactions', income.id));
      toast.success('Income and linked expenses deleted');
    } catch (error) {
      toast.error('Failed to delete income');
    }
  };

  const handleSaveEdit = async () => {
    if (!editedAmount || parseFloat(editedAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!editedDescription.trim()) {
      toast.error('Please enter a description');
      return;
    }

    try {
      const incomeRef = doc(db, 'transactions', income.id);
      await updateDoc(incomeRef, {
        amount: parseFloat(editedAmount),
        description: editedDescription.trim(),
        date: editedDate,
      });
      setIsEditing(false);
      toast.success('Income updated successfully');
    } catch (error) {
      toast.error('Failed to update income');
    }
  };

  const handleCancelEdit = () => {
    setEditedAmount(income.amount.toString());
    setEditedDescription(income.description);
    setEditedDate(income.date);
    setIsEditing(false);
  };

  const handleEditExpense = (expense: Transaction) => {
    setEditingExpense({
      id: expense.id,
      description: expense.description,
      amount: expense.amount.toString(),
    });
  };

  const handleSaveExpenseEdit = async () => {
    if (!editingExpense) return;

    if (!editingExpense.amount || parseFloat(editingExpense.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!editingExpense.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    try {
      const expenseRef = doc(db, 'transactions', editingExpense.id);
      await updateDoc(expenseRef, {
        amount: parseFloat(editingExpense.amount),
        description: editingExpense.description.trim(),
      });
      setEditingExpense(null);
      toast.success('Expense updated successfully');
    } catch (error) {
      toast.error('Failed to update expense');
    }
  };

  const isReceived = !!income.receivedAmount;
  const amountsMatch = income.receivedAmount === income.amount;
  const expectedColor = amountsMatch ? 'bg-green-50' : 'bg-gray-50';
  const receivedColor = isReceived ? (amountsMatch ? 'bg-green-50' : 'bg-red-50') : 'bg-red-50';

  if (!isExpanded) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-blue-100 hover:border-blue-200 transition-colors cursor-pointer"
           onClick={() => setIsExpanded(true)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChevronDown className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="font-medium text-gray-900">{income.description}</h3>
              <p className="text-sm text-gray-500">{format(income.date, 'MMMM d, yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Income:</span>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  isReceived 
                    ? (amountsMatch ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  ${income.receivedAmount?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Expenses:</span>
                <span className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-700">
                  ${totalExpenses.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg p-6 mb-4 border border-blue-100">
      <div className="flex justify-between items-center mb-4">
        {isEditing ? (
          <div className="flex-1 mr-4">
            <input
              type="text"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
              placeholder="Description"
            />
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  value={editedAmount}
                  onChange={(e) => setEditedAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Amount"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="flex-1">
                <DatePicker
                  selected={editedDate}
                  onChange={(date: Date) => setEditedDate(date)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  dateFormat="MMMM d, yyyy"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsExpanded(false)}
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{income.description}</h3>
              <p className="text-sm text-gray-500">{format(income.date, 'MMMM d, yyyy')}</p>
            </div>
          </div>
        )}
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                className="text-green-500 hover:text-green-600 transition-colors"
                title="Save changes"
              >
                <Save className="w-5 h-5" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-600 transition-colors"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-500 hover:text-blue-600 transition-colors"
                title="Edit income"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                className="text-red-500 hover:text-red-600 transition-colors"
                title="Delete income"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`${expectedColor} rounded-lg p-3 transition-colors duration-200`}>
          <p className={`text-sm ${amountsMatch ? 'text-green-600' : 'text-gray-600'} mb-1`}>Expected</p>
          <p className={`text-lg font-semibold ${amountsMatch ? 'text-green-700' : 'text-gray-900'}`}>
            ${income.amount.toFixed(2)}
          </p>
        </div>
        <div className={`${receivedColor} rounded-lg p-3 transition-colors duration-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isReceived ? (amountsMatch ? 'text-green-600' : 'text-red-600') : 'text-red-600'} mb-1 transition-colors duration-200`}>
                Received
              </p>
              <p className={`text-lg font-semibold ${isReceived ? (amountsMatch ? 'text-green-700' : 'text-red-700') : 'text-red-700'} transition-colors duration-200`}>
                ${income.receivedAmount?.toFixed(2) || '0.00'}
              </p>
            </div>
            <button
              onClick={handleToggleReceived}
              className={`${
                isReceived ? (amountsMatch ? 'text-green-500 hover:text-green-600' : 'text-red-500 hover:text-red-600') : 'text-red-300 hover:text-red-400'
              } transition-colors duration-200`}
              title="Toggle received status"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {linkedExpenses.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Allocated Expenses</h4>
            <button
              onClick={() => setShowExpenses(!showExpenses)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              {showExpenses ? (
                <>
                  Hide
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Show
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          {showExpenses && (
            <div className="space-y-2">
              {linkedExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                    expense.funded 
                      ? 'bg-blue-50/70 border border-blue-100' 
                      : 'bg-gray-50/70 border border-gray-100'
                  }`}
                >
                  {editingExpense?.id === expense.id ? (
                    <div className="flex-1 flex items-center gap-4">
                      <input
                        type="text"
                        value={editingExpense.description}
                        onChange={(e) => setEditingExpense({
                          ...editingExpense,
                          description: e.target.value
                        })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Description"
                      />
                      <input
                        type="number"
                        value={editingExpense.amount}
                        onChange={(e) => setEditingExpense({
                          ...editingExpense,
                          amount: e.target.value
                        })}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Amount"
                        step="0.01"
                        min="0"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveExpenseEdit}
                          className="text-green-500 hover:text-green-600 transition-colors"
                          title="Save changes"
                        >
                          <Save className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setEditingExpense(null)}
                          className="text-gray-500 hover:text-gray-600 transition-colors"
                          title="Cancel"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className={`font-medium ${
                            expense.funded 
                              ? 'text-blue-700 line-through decoration-2' 
                              : 'text-gray-700'
                          }`}>
                            {expense.description}
                          </p>
                          {expense.budgetCategory && (
                            <span className={`text-xs px-2 py-1 rounded-full border ${budgetCategoryColors[expense.budgetCategory]}`}>
                              {budgetCategoryLabels[expense.budgetCategory]}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${
                          expense.funded ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {expense.category}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`font-medium ${
                          expense.funded ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          ${expense.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="text-blue-500 hover:text-blue-600 transition-colors"
                          title="Edit expense"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, 'transactions', expense.id), {
                                funded: !expense.funded
                              });
                              toast.success('Expense status updated');
                            } catch (error) {
                              toast.error('Failed to update expense status');
                            }
                          }}
                          className={`${
                            expense.funded 
                              ? 'text-blue-500 hover:text-blue-600' 
                              : 'text-gray-400 hover:text-gray-500'
                          } transition-colors`}
                          title="Toggle funded status"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await deleteDoc(doc(db, 'transactions', expense.id));
                              toast.success('Expense deleted');
                            } catch (error) {
                              toast.error('Failed to delete expense');
                            }
                          }}
                          className="text-red-500 hover:text-red-600 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}