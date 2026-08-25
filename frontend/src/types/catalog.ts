export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  createdAt?: string;
  productCount?: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  manufacturer?: string;
  description?: string;
  price: number;
  unit: string;
  imageUrl?: string;
  data: Record<string, any>;
  category?: Category;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  manufacturer?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest';
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

export interface ProductDetailResponse {
  success: boolean;
  data: Product;
}
