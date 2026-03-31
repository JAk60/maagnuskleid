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
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem } = useCart();
  const slug = generateSlug(product.name);
  const isOutOfStock = product.stock === 0;

  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes[0] || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // ✅ Only 2 images (performance optimized)
  const sortedImages =
    product.images && product.images.length > 0
      ? [...product.images]
          .sort((a, b) => a.display_order - b.display_order)
          .map((img) => img.image_url)
      : [product.image_url || '/placeholder-product.jpg'];

  const firstImage = sortedImages[0];
  const secondImage = sortedImages[1];

  const handleMouseEnter = () => {
    if (secondImage) setActiveImageIndex(1);
  };

  const handleMouseLeave = () => {
    setActiveImageIndex(0);
  };

  const getColorHex = (color: string | { name?: string; hex: string }) => {
    if (typeof color === 'string') return color;
    return color?.hex || '#000';
  };

  const getFirstColorForCart = (): string => {
    const firstColor = product.colors[0];
    if (typeof firstColor === 'string') return firstColor;
    return firstColor?.hex || '#000';
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedSize) {
      toast.error('Select a size');
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
        image: firstImage,
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

    toast.success('Added to cart');

    setTimeout(() => {
      setIsAdding(false);
      setQuantity(1);
    }, 400);
  };

  return (
    <div className="group transform-gpu will-change-transform">
      {/* IMAGE */}
      <Link href={`/products/${slug}`}>
        <div
          className="relative aspect-3/4 overflow-hidden rounded-xl mb-4 bg-[#f3f3f3] contain-[layout_paint]"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Skeleton */}
          <div
            className={`absolute inset-0 bg-gray-200 transition-opacity duration-300 ${
              loaded ? 'opacity-0' : 'opacity-100 animate-pulse'
            }`}
          />

          {/* First Image */}
          <Image
            src={firstImage}
            alt={product.name}
            fill
            priority={index < 4}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transform-gpu will-change-transform transition-transform duration-500 group-hover:scale-105"
            onLoadingComplete={() => setLoaded(true)}
          />

          {/* Hover Image */}
          {secondImage && (
            <Image
              src={secondImage}
              alt="hover"
              fill
              className={`object-cover absolute inset-0 transform-gpu will-change-transform transition-all duration-200 group-hover:scale-105 ${
                activeImageIndex === 1 ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* Stock */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <span className="text-white font-bold bg-red-600 px-4 py-2 rounded-lg">
                Out of Stock
              </span>
            </div>
          )}

          {!isOutOfStock && product.stock <= 5 && (
            <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
              Only {product.stock} left
            </div>
          )}
        </div>
      </Link>

      {/* TITLE */}
      <Link href={`/products/${slug}`}>
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-gray-600 transition">
          {product.name}
        </h3>
      </Link>

      {/* PRICE */}
      <p className="text-lg font-bold mb-2">
        {formatPrice(product.price)}
      </p>

      {/* COLORS */}
      <div className="flex gap-2 mb-3">
        {product.colors.slice(0, 5).map((color, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-full border"
            style={{ backgroundColor: getColorHex(color) }}
          />
        ))}
      </div>

      {/* SIZES */}
      <div className="flex flex-wrap gap-2 mb-3">
        {product.sizes.map((size) => (
          <button
            key={size}
            onClick={(e) => {
              e.preventDefault();
              setSelectedSize(size);
            }}
            className={`px-3 py-1 text-sm border rounded transition ${
              selectedSize === size
                ? 'bg-black text-white border-black'
                : 'bg-gray-100 hover:border-black'
            }`}
          >
            {size}
          </button>
        ))}
      </div>

      {/* CART */}
      {!isOutOfStock ? (
        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 transition ${
            isAdding
              ? 'bg-green-600 text-white'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          {isAdding ? 'Added' : 'Add to Cart'}
        </button>
      ) : (
        <button
          disabled
          className="w-full py-2 bg-gray-300 text-gray-500 rounded-lg"
        >
          Out of Stock
        </button>
      )}
    </div>
  );
}