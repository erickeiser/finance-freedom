import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  type?: 'income' | 'expense';
}

export default function Modal({ isOpen, onClose, title, children, type }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const headerColorClass = type === 'income' 
    ? 'bg-green-50 border-b border-green-100' 
    : type === 'expense'
    ? 'bg-red-50 border-b border-red-100'
    : 'bg-gray-50 border-b border-gray-100';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
        <div 
          ref={modalRef} 
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all"
        >
          <div className={`flex items-center justify-between px-5 py-4 ${headerColorClass} rounded-t-2xl`}>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}