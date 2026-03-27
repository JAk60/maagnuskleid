// components/products/ProductCard.tsx

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { formatPrice, generateSlug } from '@/utils/helpers';
import { useCart } from '@/context/cart-context';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fbq } from '@/lib/meta-pixel';

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
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Build sorted image list from images array, fallback to image_url
  const allImages = product.images && product.images.length > 0
    ? [...product.images].sort((a, b) => a.display_order - b.display_order).map(img => img.image_url)
    : [product.image_url || '/placeholder-product.jpg'];

  const handleMouseEnter = () => {
    if (allImages.length > 1) setActiveImageIndex(1);
  };

  const handleMouseLeave = () => {
    setActiveImageIndex(0);
  };

  const getColorHex = (color: string | { name?: string; hex: string }): string => {
    if (typeof color === 'string') {
      return color.toLowerCase() === 'white' ? '#ffffff' : color.toLowerCase();
    } else if (color && typeof color === 'object' && color.hex) {
      return color.hex;
    }
    return '#000000';
  };

  const getColorTitle = (color: string | { name?: string; hex: string }): string => {
    if (typeof color === 'string') {
      return color;
    } else if (color && typeof color === 'object') {
      return color.name ? `${color.name} (${color.hex})` : color.hex;
    }
    return 'Color';
  };

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

    fbq('AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price * quantity,
      currency: 'INR',
      num_items: quantity,
    });

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
        <div
          className="relative aspect-3/4 overflow-hidden rounded-xl bg-gray-100 mb-4"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {allImages.map((src, idx) => (
            <Image
              key={idx}
              src={src || '/placeholder-product.jpg'}
              alt={`${product.name} - view ${idx + 1}`}
              fill
              className={`object-cover transition-opacity duration-500 ${
                activeImageIndex === idx ? 'opacity-100' : 'opacity-0'
              }`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ))}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
              <span className="text-white font-bold text-lg px-4 py-2 bg-red-600 rounded-lg">
                Out of Stock
              </span>
            </div>
          )}

          {!isOutOfStock && product.stock <= 5 && (
            <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
              Only {product.stock} left
            </div>
          )}
        </div>
      </Link>

      {/* Rest of the card — unchanged */}
      <Link href={`/products/${slug}`}>
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-600 transition-colors">
          {product.name}
        </h3>
      </Link>

      <p className="text-xl font-bold text-gray-900 mb-3">
        {formatPrice(product.price)}
      </p>

      <div className="flex items-center gap-2 mb-3">
        {product.colors.slice(0, 5).map((color, idx) => (
          <div
            key={idx}
            className="w-5 h-5 rounded-full border-2 border-gray-300"
            style={{ backgroundColor: getColorHex(color) }}
            title={getColorTitle(color)}
          />
        ))}
        {product.colors.length > 5 && (
          <span className="text-xs text-gray-500 font-medium">
            +{product.colors.length - 5}
          </span>
        )}
      </div>

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
              className={`px-3 py-1.5 text-sm font-medium border-2 rounded-lg transition-all ${
                selectedSize === size
                  ? 'bg-black text-white border-black'
                  : 'bg-[#E3D9C6] text-gray-700 border-gray-300 hover:border-black'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {!isOutOfStock && (
        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
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

          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              isAdding
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