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
  similarityScore?: number;
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
  isAiSearch?: boolean;
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

export interface AiSearchResultItem {
  id: string;
  entity_id: string;
  entity_type: 'product' | 'knowledge_doc';
  code: string;
  title: string;
  category: string;
  content: string;
  metadata: Record<string, any>;
  similarity_score: number;
  distance: number;
}

export interface AiSearchResponse {
  success: boolean;
  query: string;
  count: number;
  data: AiSearchResultItem[];
}
