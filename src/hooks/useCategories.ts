// ========================================
// hooks/useCategories.ts - React Hook
// ========================================

import { useState, useEffect } from 'react';
import { Category } from '@/lib/categories-db';

interface CategoriesResponse {
  success: boolean;
  data: Category[];
  error?: string;
}

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
      const data = await response.json() as CategoriesResponse;

      if (!data.success) throw new Error(data.error || 'Failed to fetch categories');

      setCategories(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { categories, loading, error, refetch: fetchCategories };
}