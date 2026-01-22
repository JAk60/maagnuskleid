// context/cart-context.tsx - FIXED VERSION
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string; // Required field
  quantity: number;
  stock?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number, size: string, color: string) => void;
  updateQuantity: (id: number, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  isInCart: (id: number, size: string, color: string) => boolean;
  getCartItemQuantity: (id: number, size: string, color: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Validate cart items have required fields
        const validatedCart = parsedCart.filter((item: any) => 
          item.id && item.size && item.color && item.quantity > 0
        );
        setItems(validatedCart);
      } catch (error) {
        console.error('Error loading cart:', error);
        localStorage.removeItem('cart'); // Clear invalid cart data
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem('cart', JSON.stringify(items));
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    }
  }, [items, mounted]);

  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    // Validate required fields
    if (!newItem.color || !newItem.size) {
      console.error('Cannot add item: missing color or size');
      return;
    }

    setItems((currentItems) => {
      // Find existing item with same id, size, AND color
      const existingItem = currentItems.find(
        (item) => 
          item.id === newItem.id && 
          item.size === newItem.size && 
          item.color === newItem.color
      );

      if (existingItem) {
        // Increment quantity of existing item
        const newQuantity = existingItem.quantity + 1;
        
        // Check stock limit if available
        if (newItem.stock && newQuantity > newItem.stock) {
          console.warn('Stock limit reached');
          return currentItems; // Don't add more
        }
        
        return currentItems.map((item) =>
          item.id === newItem.id && 
          item.size === newItem.size && 
          item.color === newItem.color
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      // Add new item with quantity 1
      return [...currentItems, { ...newItem, quantity: 1 }];
    });
  };

  const removeItem = (id: number, size: string, color: string) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => !(item.id === id && item.size === size && item.color === color)
      )
    );
  };

  const updateQuantity = (id: number, size: string, color: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(id, size, color);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id === id && item.size === size && item.color === color) {
          // Check stock limit
          if (item.stock && quantity > item.stock) {
            console.warn('Stock limit reached');
            return item; // Don't update
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    if (mounted) {
      localStorage.removeItem('cart');
    }
  };

  const isInCart = (id: number, size: string, color: string) => {
    return items.some(
      (item) => item.id === id && item.size === size && item.color === color
    );
  };

  const getCartItemQuantity = (id: number, size: string, color: string) => {
    const item = items.find(
      (item) => item.id === id && item.size === size && item.color === color
    );
    return item ? item.quantity : 0;
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
        isInCart,
        getCartItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}