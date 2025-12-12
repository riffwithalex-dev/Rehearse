import React from 'react';
import { useData } from '../context/DataContext';
import { X } from 'lucide-react';

export const DbErrorBanner: React.FC = () => {
  const { dbError, clearDbError } = useData() as any;
  if (!dbError) return null;

  return (
    <div className="w-full mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-900 flex items-start justify-between gap-4">
      <div className="flex-1 text-sm">{dbError}</div>
      <button onClick={clearDbError} className="p-1 rounded hover:bg-red-100">
        <X size={16} />
      </button>
    </div>
  );
};

export default DbErrorBanner;
