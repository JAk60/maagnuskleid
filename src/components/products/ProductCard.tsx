// components/products/ProductCard.tsx - CLEAN DESIGN

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { formatPrice, generateSlug } from '@/utils/helpers';
import { useCart } from '@/context/cart-context';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const slug = generateSlug(product.name);
  const isOutOfStock = product.stock === 0;

  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  // Helper function to get color hex value
  const getColorHex = (color: any): string => {
    if (typeof color === 'string') {
      return color.toLowerCase() === 'white' ? '#ffffff' : color.toLowerCase();
    } else if (color && typeof color === 'object' && color.hex) {
      return color.hex;
    }
    return '#000000';
  };

  // Helper function to get color title
  const getColorTitle = (color: any): string => {
    if (typeof color === 'string') {
      return color;
    } else if (color && typeof color === 'object') {
      return color.name ? `${color.name} (${color.hex})` : color.hex;
    }
    return 'Color';
  };

  // Helper function to get first color for cart (backward compatible)
  const getFirstColorForCart = (): string => {
    const firstColor = product.colors[0];
    if (typeof firstColor === 'string') {
      return firstColor;
    } else if (firstColor && typeof firstColor === 'object' && 'hex' in firstColor) {
      return (firstColor as { hex: string }).hex;
    }
    return '#000000';
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }

    if (isOutOfStock) {
      toast.error('Out of stock');
      return;
    }

    if (quantity > product.stock) {
      toast.error('Not enough stock');
      return;
    }

    setIsAdding(true);

    // Add to cart 'quantity' times
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || '/placeholder-product.jpg',
        size: selectedSize,
        color: getFirstColorForCart(),
        stock: product.stock,
      });
    }

    toast.success(`Added ${quantity} item(s) to cart!`);

    setTimeout(() => {
      setIsAdding(false);
      setQuantity(1);
    }, 600);
  };

  return (
    <div className="group">
      {/* Image */}
      <Link href={`/products/${slug}`}>
        <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-gray-100 mb-4">
          <Image
            src={product.image_url || '/placeholder-product.jpg'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-bold text-lg px-4 py-2 bg-red-600 rounded-lg">
                Out of Stock
              </span>
            </div>
          )}

          {!isOutOfStock && product.stock <= 5 && (
            <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              Only {product.stock} left
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <Link href={`/products/${slug}`}>
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-600 transition-colors">
          {product.name}
        </h3>
      </Link>

      <p className="text-xl font-bold text-gray-900 mb-3">
        {formatPrice(product.price)}
      </p>

      {/* Colors */}
      <div className="flex items-center gap-2 mb-3">
        {product.colors.slice(0, 5).map((color, idx) => (
          <div
            key={idx}
            className="w-5 h-5 rounded-full border-2 border-gray-300"
            style={{
              backgroundColor: getColorHex(color)
            }}
            title={getColorTitle(color)}
          />
        ))}
        {product.colors.length > 5 && (
          <span className="text-xs text-gray-500 font-medium">
            +{product.colors.length - 5}
          </span>
        )}
      </div>

      {/* Sizes */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((size) => (
            <button
              key={size}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedSize(size);
              }}
              className={`px-3 py-1.5 text-sm font-medium border-2 rounded-lg transition-all ${selectedSize === size
                  ? 'bg-black text-white border-black'
                  : 'bg-[#E3D9C6] text-gray-700 border-gray-300 hover:border-black'
                }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity & Add to Cart */}
      {!isOutOfStock && (
        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
          {/* Quantity Selector */}
          <div className="flex items-center justify-between border-2 border-gray-200 rounded-lg p-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                setQuantity(Math.max(1, quantity - 1));
              }}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors font-bold text-lg"
            >
              −
            </button>

            <span className="font-semibold text-lg">{quantity}</span>

            <button
              onClick={(e) => {
                e.preventDefault();
                if (quantity < product.stock) {
                  setQuantity(quantity + 1);
                } else {
                  toast.error('Maximum stock reached');
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors font-bold text-lg"
            >
              +
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${isAdding
                ? 'bg-green-600 text-white'
                : 'bg-black text-white hover:bg-gray-800'
              }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {isAdding ? 'Added!' : 'Add to Cart'}
          </button>
        </div>
      )}

      {isOutOfStock && (
        <button
          disabled
          className="w-full py-3 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
        >
          Out of Stock
        </button>
      )}
    </div>
  );
}