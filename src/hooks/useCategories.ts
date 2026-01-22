// ========================================
// hooks/useCategories.ts - React Hook
// ========================================

import { useState, useEffect } from 'react';
import { Category } from '@/lib/categories-db';

export function useCategories(gender?: 'Male' | 'Female', withCount = false) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [gender, withCount]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (gender) params.set('gender', gender);
      if (withCount) params.set('withCount', 'true');

      const response = await fetch(`/api/categories?${params}`);
      const data = await response.json();

      if (!data.success) throw new Error(data.error);

      setCategories(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { categories, loading, error, refetch: fetchCategories };
}