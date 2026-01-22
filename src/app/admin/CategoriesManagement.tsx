'use client';

import {
  Edit,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
  gender: 'Male' | 'Female' | 'Unisex';
  description: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
}

interface CategoriesApiResponse {
  success: boolean;
  data?: Category[];
  error?: string;
}

interface CategoryMutationResponse {
  success: boolean;
  error?: string;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [filterGender, setFilterGender] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    gender: 'Male' as 'Male' | 'Female' | 'Unisex',
    description: '',
    image_url: '',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/admin/categories');
      const data = (await response.json()) as CategoriesApiResponse;

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch categories');
      }

      setCategories(data.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      alert(
        'Failed to load categories: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category: Category | null = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        gender: category.gender,
        description: category.description || '',
        image_url: category.image_url || '',
        display_order: category.display_order,
        is_active: category.is_active
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        gender: 'Male',
        description: '',
        image_url: '',
        display_order: categories.length + 1,
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      alert('Name and slug are required');
      return;
    }

    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const body = editingCategory
        ? { id: editingCategory.id, ...formData }
        : formData;

      const response = await fetch('/api/admin/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = (await response.json()) as CategoryMutationResponse;

      if (!data.success) {
        throw new Error(data.error || 'Operation failed');
      }

      alert(editingCategory ? 'Category updated!' : 'Category created!');
      await fetchCategories();
      handleCloseModal();
    } catch (error) {
      console.error('Submit error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Products using it will need reassignment.')) return;

    try {
      const response = await fetch(`/api/admin/categories?id=${id}`, {
        method: 'DELETE'
      });

      const data = (await response.json()) as CategoryMutationResponse;

      if (!data.success) {
        throw new Error(data.error || 'Delete failed');
      }

      alert('Category deleted!');
      fetchCategories();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: category.id,
          is_active: !category.is_active
        })
      });

      const data = (await response.json()) as CategoryMutationResponse;

      if (!data.success) {
        throw new Error(data.error || 'Update failed');
      }

      fetchCategories();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const filteredCategories = categories.filter(
    (cat) => filterGender === 'all' || cat.gender === filterGender
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Category Management
          </h1>
          <p className="text-gray-600 mt-1">Manage product categories</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Unisex">Unisex</option>
        </select>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Gender
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {filteredCategories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">
                      {category.display_order}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <p className="font-semibold">{category.name}</p>
                  {category.description && (
                    <p className="text-xs text-gray-500">
                      {category.description}
                    </p>
                  )}
                </td>

                <td className="px-6 py-4">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {category.slug}
                  </code>
                </td>

                <td className="px-6 py-4">
                  <span className="text-xs font-semibold">
                    {category.gender}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleActive(category)}
                    className="flex items-center gap-1 text-xs"
                  >
                    {category.is_active ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                    {category.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>

                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleOpenModal(category)}
                    className="p-2 text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal remains unchanged */}
    </div>
  );
}
