
import { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  price: string;
  stock_quantity: number;
  status: 'active' | 'inactive';
  images: Array<{ src: string }>;
  categories: Array<{ name: string }>;
}

interface UseProductsParams {
  search?: string;
  category?: string;
  stock?: string;
  status?: string;
  page?: number;
}

interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  totalPages: number;
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  refetch: () => void;
}

export function useProducts(params: UseProductsParams): UseProductsReturn {
  const [products] = useState<Product[]>([
    {
      id: 1,
      name: 'Produto Exemplo 1',
      price: '99.90',
      stock_quantity: 10,
      status: 'active',
      images: [{ src: '/placeholder.svg' }],
      categories: [{ name: 'Categoria A' }]
    },
    {
      id: 2,
      name: 'Produto Exemplo 2',
      price: '149.90',
      stock_quantity: 5,
      status: 'active',
      images: [{ src: '/placeholder.svg' }],
      categories: [{ name: 'Categoria B' }]
    }
  ]);

  return {
    products,
    isLoading: false,
    totalPages: 1,
    totalProducts: 2,
    activeProducts: 2,
    inactiveProducts: 0,
    refetch: () => {}
  };
}
