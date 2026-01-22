import { Category } from "@/lib/categories-db";
import { ChevronDown, ChevronUp, Edit, Image as ImageIcon, Package, Plus, Ruler, Save, Search, Trash2, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";

interface ColorOption {
  name: string;
  hex: string;
}

interface ProductImage {
  id?: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

interface SizeChart {
  size: string;
  chest?: number;
  length?: number;
  bust?: number;
  length_female?: number;
  notes?: string;
}

interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  sizes: string[];
  colors: ColorOption[];
  stock: number;
  gender: "Male" | "Female";
  images?: ProductImage[];
  has_size_chart?: boolean;
  size_chart?: SizeChart[];
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
  sku?: string;
}

interface ProductsApiResponse {
  success: boolean;
  data: Product[];
  error?: string;
}

interface DeleteApiResponse {
  success: boolean;
  error?: string;
}

interface CloudinaryUploadResult {
  event: string;
  info?: {
    secure_url: string;
  };
}

interface CloudinaryWidget {
  open: () => void;
  close: () => void;
}

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        config: Record<string, unknown>,
        callback: (error: Error | null, result: CloudinaryUploadResult) => void
      ) => CloudinaryWidget;
    };
  }
}

const SIZES = ["XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

const COLOR_PRESETS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Yellow', hex: '#F59E0B' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Gray', hex: '#6B7280' },
  { name: 'Navy', hex: '#1E3A8A' },
  { name: 'Maroon', hex: '#991B1B' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Beige', hex: '#D4B5A0' },
  { name: 'Brown', hex: '#78350F' },
];

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterGender, setFilterGender] = useState<"all" | "Male" | "Female">("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [colorNameInput, setColorNameInput] = useState("");
  const [colorHexInput, setColorHexInput] = useState("");
  const [showPresets, setShowPresets] = useState(false);
  const [cloudinaryLoaded, setCloudinaryLoaded] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [sizeChart, setSizeChart] = useState<SizeChart[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState<Product>({
    name: "",
    description: "",
    price: 0,
    image_url: "",
    category: "",
    sizes: [],
    colors: [],
    stock: 0,
    gender: "Male",
    has_size_chart: false,
    weight: 0.5,
    length: 10,
    breadth: 10,
    height: 5,
    sku: "",
  });

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json() as { success: boolean; data: Category[] };
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const getCategoriesByGender = (gender: 'Male' | 'Female') => {
    return categories.filter(cat => cat.gender === gender);
  };

  const availableCategories = getCategoriesByGender(formData.gender);
  
  const loadCloudinaryScript = () => {
    if (window.cloudinary) {
      setCloudinaryLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    script.onload = () => setCloudinaryLoaded(true);
    script.onerror = () => alert("Failed to load Cloudinary. Please refresh the page.");
    document.body.appendChild(script);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/products");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as ProductsApiResponse;

      if (!data.success) {
        throw new Error(data.error || "Failed to load products");
      }

      setProducts(data.data);
    } catch (error) {
      console.error("Failed to load products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...product,
        weight: product.weight || 0.5,
        length: product.length || 10,
        breadth: product.breadth || 10,
        height: product.height || 5,
        sku: product.sku || "",
      });
      
      if (product.images && product.images.length > 0) {
        setProductImages(product.images);
      } else if (product.image_url) {
        setProductImages([{
          image_url: product.image_url,
          display_order: 0,
          is_primary: true
        }]);
      } else {
        setProductImages([]);
      }
      
      setSizeChart(product.size_chart || []);
      setShowSizeChart(product.has_size_chart || false);
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: 0,
        image_url: "",
        category: "",
        sizes: [],
        colors: [],
        stock: 0,
        gender: "Male",
        has_size_chart: false,
        weight: 0.5,
        length: 10,
        breadth: 10,
        height: 5,
        sku: "",
      });
      setProductImages([]);
      setSizeChart([]);
      setShowSizeChart(false);
    }
    setColorNameInput("");
    setColorHexInput("");
    setShowPresets(false);
    setShowModal(true);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    loadCloudinaryScript();
  }, []);

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setProductImages([]);
    setSizeChart([]);
    setShowSizeChart(false);
  };

  const handleCloudinaryUpload = (imageIndex?: number) => {
    if (!cloudinaryLoaded || !window.cloudinary) {
      alert("Cloudinary is still loading. Please try again in a moment.");
      return;
    }
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      alert("Cloudinary is not configured.");
      return;
    }
    setUploading(true);
    
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        sources: ["local", "url", "camera"],
        folder: "products",
        multiple: false,
        maxFiles: 1,
        maxFileSize: 2000000,
        clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
        resourceType: "image",
        cropping: true,
        croppingAspectRatio: 1,
      },
      (error: Error | null, result: CloudinaryUploadResult) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          alert("Upload failed");
          setUploading(false);
          return;
        }
        if (result?.event === "success" && result.info) {
          const imageUrl = result.info.secure_url;
          if (imageIndex !== undefined) {
            const newImages = [...productImages];
            newImages[imageIndex] = { ...newImages[imageIndex], image_url: imageUrl };
            setProductImages(newImages);
          } else {
            const newImage: ProductImage = {
              image_url: imageUrl,
              display_order: productImages.length,
              is_primary: productImages.length === 0,
            };
            setProductImages([...productImages, newImage]);
          }
          if (productImages.length === 0 || imageIndex === 0) {
            setFormData(prev => ({ ...prev, image_url: imageUrl }));
          }
          setUploading(false);
          widget.close();
        }
        if (result?.event === "close" || result?.event === "abort") {
          setUploading(false);
        }
      }
    );
    widget.open();
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const newImages = [...productImages];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    newImages[index].display_order = index;
    newImages[targetIndex].display_order = targetIndex;
    setProductImages(newImages);
    if (newImages[0].is_primary) {
      setFormData(prev => ({ ...prev, image_url: newImages[0].image_url }));
    }
  };

  const removeImage = (index: number) => {
    const newImages = productImages.filter((_, i) => i !== index);
    newImages.forEach((img, i) => {
      img.display_order = i;
      if (i === 0) img.is_primary = true;
    });
    setProductImages(newImages);
    if (newImages.length > 0) {
      setFormData(prev => ({ ...prev, image_url: newImages[0].image_url }));
    }
  };

  const setPrimaryImage = (index: number) => {
    const newImages = productImages.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    setProductImages(newImages);
    setFormData(prev => ({ ...prev, image_url: newImages[index].image_url }));
  };

  const initializeSizeChart = () => {
    const chart = formData.sizes.map(size => ({
      size,
      chest: undefined,
      length: undefined,
      bust: undefined,
      length_female: undefined,
      notes: "",
    }));
    setSizeChart(chart);
  };

  const updateSizeChart = (index: number, field: keyof SizeChart, value: number | string | undefined) => {
    const newChart = [...sizeChart];
    newChart[index] = { ...newChart[index], [field]: value };
    setSizeChart(newChart);
  };

  const addPresetColor = (preset: ColorOption) => {
    if (formData.colors.some(c => c.hex === preset.hex)) {
      alert("This color is already added");
      return;
    }
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, preset],
    }));
  };

  const handleAddCustomColor = () => {
    if (!colorNameInput.trim() || !colorHexInput.trim()) {
      alert("Please enter both color name and hex code");
      return;
    }
    let hex = colorHexInput.trim();
    if (!hex.startsWith("#")) hex = "#" + hex;
    const regex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
    if (!regex.test(hex)) {
      alert("Invalid hex color");
      return;
    }
    if (hex.length === 4) {
      hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    if (formData.colors.some(c => c.hex === hex.toUpperCase())) {
      alert("This color is already added");
      return;
    }
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, { name: colorNameInput.trim(), hex: hex.toUpperCase() }],
    }));
    setColorNameInput("");
    setColorHexInput("");
  };

  const removeColor = (hex: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(x => x.hex !== hex),
    }));
  };

  const toggleSize = (size: string) => {
    const newSizes = formData.sizes.includes(size)
      ? formData.sizes.filter(s => s !== size)
      : [...formData.sizes, size];
    setFormData(prev => ({ ...prev, sizes: newSizes }));
    if (showSizeChart) {
      if (newSizes.includes(size) && !sizeChart.find(s => s.size === size)) {
        setSizeChart([...sizeChart, { size, notes: "" }]);
      } else if (!newSizes.includes(size)) {
        setSizeChart(sizeChart.filter(s => s.size !== size));
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Product name is required");
      return;
    }
    if (formData.price <= 0) {
      alert("Price must be greater than 0");
      return;
    }
    if (!formData.category) {
      alert("Please select a category");
      return;
    }
    if (!formData.sizes.length) {
      alert("Select at least one size");
      return;
    }
    if (!formData.colors.length) {
      alert("Add at least one color");
      return;
    }
    if (productImages.length === 0) {
      alert("Please upload at least one product image");
      return;
    }
    if (!formData.weight || formData.weight < 0.1) {
      alert("Weight must be at least 0.1 kg");
      return;
    }
    if (!formData.length || formData.length < 1) {
      alert("Length must be at least 1 cm");
      return;
    }
    if (!formData.breadth || formData.breadth < 1) {
      alert("Breadth must be at least 1 cm");
      return;
    }
    if (!formData.height || formData.height < 1) {
      alert("Height must be at least 1 cm");
      return;
    }
    if (showSizeChart && sizeChart.length > 0) {
      const isValid = sizeChart.every(s => {
        if (formData.gender === "Male") {
          return s.chest && s.length;
        } else {
          return s.bust && s.length_female;
        }
      });
      if (!isValid) {
        alert(`Please fill all size chart measurements for ${formData.gender === "Male" ? "Chest and Length" : "Bust and Length"}`);
        return;
      }
    }
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        images: productImages,
        has_size_chart: showSizeChart,
        size_chart: showSizeChart ? sizeChart : [],
      };
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProduct ? { id: editingProduct.id, ...payload } : payload),
      });
      const data = await res.json() as ProductsApiResponse;
      if (!res.ok || !data.success) throw new Error(data.error);
      alert(editingProduct ? "Product updated successfully!" : "Product created successfully!");
      await fetchProducts();
      handleCloseModal();
    } catch (err) {
      if (err instanceof Error) {
        alert("Error: " + err.message);
      } else {
        alert("An unknown error occurred");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json() as DeleteApiResponse;

      if (!data.success) {
        throw new Error(data.error || "Delete failed");
      }

      alert("Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      if (error instanceof Error) {
        alert("Error: " + error.message);
      } else {
        alert("An unknown error occurred");
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const s = searchQuery.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(s) || p.category.toLowerCase().includes(s);
    const matchesGender = filterGender === "all" || p.gender === filterGender;
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    return matchesSearch && matchesGender && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentItems = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600 mt-1">{filteredProducts.length} products found</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-lg"
        >
          <Plus size={20} /> Add Product
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-62.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search products..."
              className="w-full px-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterGender}
            onChange={(e) => {
              setFilterGender(e.target.value as "all" | "Male" | "Female");
              setFilterCategory("all");
              setCurrentPage(1);
            }}
            className="border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {currentItems.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        ) : (
          currentItems.map((product) => (
            <div key={product.id} className="bg-white rounded-lg border p-4 flex gap-4 hover:shadow-md transition">
              <Image
                src={product.image_url}
                alt={product.name}
                width={96}
                height={96}
                className="w-24 h-24 rounded object-cover"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id!)}
                      className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 flex-wrap">
                  <span className="font-bold text-blue-600 text-lg">₹{product.price.toLocaleString()}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${product.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                    {product.gender}
                  </span>
                  {product.weight && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Package size={14} />
                      {product.weight}kg • {product.length}×{product.breadth}×{product.height}cm
                    </span>
                  )}
                  {product.has_size_chart && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Ruler size={14} />
                      Size Chart
                    </span>
                  )}
                  {product.images && product.images.length > 1 && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold flex items-center gap-1">
                      <ImageIcon size={14} />
                      {product.images.length} Images
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded disabled:opacity-40 hover:bg-gray-100 transition"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 border rounded transition ${currentPage === i + 1 ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-40 hover:bg-gray-100 transition"
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button onClick={handleCloseModal} className="hover:bg-gray-100 p-2 rounded-full transition">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block font-medium mb-1">Product Name *</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Premium Cotton T-Shirt"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as "Male" | "Female", category: "" })}
                    className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    {availableCategories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Stock *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="text-orange-600" size={24} />
                  <h3 className="text-lg font-bold text-orange-900">Shipping Details (For ShipRocket)</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-1 text-sm">Weight (kg) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0.5 })}
                      className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="0.5"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum: 0.1 kg</p>
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-sm">SKU (Optional)</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Auto-generated if empty"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for auto SKU</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block font-medium mb-1 text-sm">Length (cm) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={formData.length}
                      onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || 10 })}
                      className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-sm">Breadth (cm) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={formData.breadth}
                      onChange={(e) => setFormData({ ...formData, breadth: parseFloat(e.target.value) || 10 })}
                      className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-sm">Height (cm) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 5 })}
                      className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="5"
                    />
                  </div>
                </div>

                <p className="text-xs text-orange-700 mt-3">
                  📦 These details are required for ShipRocket shipping integration
                </p>
              </div>

              <div>
                <label className="block font-medium mb-3">Product Images * (Multiple)</label>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {productImages.map((img, index) => (
                    <div key={index} className="relative border-2 border-gray-300 rounded-lg overflow-hidden group">
                      <Image
                        src={img.image_url}
                        alt={`Product ${index + 1}`}
                        width={300}
                        height={300}
                        className="w-full h-48 object-cover"
                      />

                      {img.is_primary && (
                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">
                          Primary
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          onClick={() => moveImage(index, "up")}
                          disabled={index === 0}
                          className="p-2 bg-white rounded disabled:opacity-50"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          onClick={() => moveImage(index, "down")}
                          disabled={index === productImages.length - 1}
                          className="p-2 bg-white rounded disabled:opacity-50"
                        >
                          <ChevronDown size={16} />
                        </button>
                        {!img.is_primary && (
                          <button onClick={() => setPrimaryImage(index)} className="p-2 bg-blue-600 text-white rounded text-xs">
                            Set Primary
                          </button>
                        )}
                        <button onClick={() => handleCloudinaryUpload(index)} className="p-2 bg-green-600 text-white rounded">
                          <Upload size={16} />
                        </button>
                        <button onClick={() => removeImage(index)} className="p-2 bg-red-600 text-white rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleCloudinaryUpload()}
                  disabled={uploading}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition disabled:opacity-50"
                >
                  <Upload size={32} className="mx-auto mb-2 text-blue-600" />
                  <p className="font-medium text-gray-700">
                    {uploading ? "Uploading..." : `Add ${productImages.length > 0 ? 'Another' : ''} Image`}
                  </p>
                </button>
              </div>

              <div>
                <label className="block font-medium mb-2">Available Sizes *</label>
                <div className="flex gap-2 flex-wrap">
                  {SIZES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className={`px-4 py-2 border rounded-lg transition ${formData.sizes.includes(s)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white hover:bg-gray-50"
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showSizeChart}
                      onChange={(e) => {
                        setShowSizeChart(e.target.checked);
                        if (e.target.checked && sizeChart.length === 0) {
                          initializeSizeChart();
                        }
                      }}
                      className="w-5 h-5"
                    />
                    <span className="font-medium">Add Size Chart</span>
                  </label>
                  {showSizeChart && (
                    <button
                      type="button"
                      onClick={initializeSizeChart}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Reset Chart
                    </button>
                  )}
                </div>

                {showSizeChart && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="text-sm text-gray-600 mb-3">
                      {formData.gender === "Male" ? (
                        <span>📏 Fill measurements: <strong>Chest</strong> and <strong>Length</strong> (in inches)</span>
                      ) : (
                        <span>📏 Fill measurements: <strong>Bust</strong> and <strong>Length</strong> (in inches)</span>
                      )}
                    </div>

                    {sizeChart.length === 0 ? (
                      <p className="text-gray-500 text-sm">Select sizes above to add to size chart</p>
                    ) : (
                      <div className="space-y-3">
                        {sizeChart.map((item, index) => (
                          <div key={item.size} className="bg-white p-4 rounded border">
                            <h4 className="font-bold mb-3 text-lg">{item.size}</h4>

                            {formData.gender === "Male" ? (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Chest (inches) *</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={item.chest || ""}
                                    onChange={(e) => updateSizeChart(index, "chest", parseFloat(e.target.value) || undefined)}
                                    className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., 38"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Length (inches) *</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={item.length || ""}
                                    onChange={(e) => updateSizeChart(index, "length", parseFloat(e.target.value) || undefined)}
                                    className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., 27"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Bust (inches) *</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={item.bust || ""}
                                    onChange={(e) => updateSizeChart(index, "bust", parseFloat(e.target.value) || undefined)}
                                    className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., 34"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Length (inches) *</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={item.length_female || ""}
                                    onChange={(e) => updateSizeChart(index, "length_female", parseFloat(e.target.value) || undefined)}
                                    className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., 28"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="mt-3">
                              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                              <input
                                type="text"
                                value={item.notes || ""}
                                onChange={(e) => updateSizeChart(index, "notes", e.target.value)}
                                className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
                                placeholder="Any additional info..."
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium mb-2">Colors *</label>

                {formData.colors.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {formData.colors.map((c) => (
                      <div
                        key={c.hex}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
                      >
                        <div
                          className="w-6 h-6 rounded border-2 border-gray-300"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-sm font-medium">{c.name}</span>
                        <button
                          type="button"
                          onClick={() => removeColor(c.hex)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowPresets(!showPresets)}
                    className="text-blue-600 hover:underline text-sm font-medium"
                  >
                    {showPresets ? "Hide" : "Show"} Color Presets
                  </button>

                  {showPresets && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-5 gap-2">
                        {COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => addPresetColor(preset)}
                            className="flex flex-col items-center gap-1 p-2 hover:bg-white rounded transition"
                          >
                            <div
                              className="w-10 h-10 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: preset.hex }}
                            />
                            <span className="text-xs">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">Add Custom Color</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={colorNameInput}
                        onChange={(e) => setColorNameInput(e.target.value)}
                        placeholder="Color name"
                        className="flex-1 border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={colorHexInput}
                        onChange={(e) => setColorHexInput(e.target.value)}
                        placeholder="#RRGGBB"
                        className="w-32 border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomColor}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {editingProduct ? "Update Product" : "Create Product"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}