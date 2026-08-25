import {
  Category,
  Product,
  ProductQueryParams,
  ProductsResponse,
  CategoriesResponse,
  ProductDetailResponse,
  AiSearchResponse,
} from '@/types/catalog';
import { CATALOG_CONSTANTS } from '@/lib/constants';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const AI_BASE_URL =
  process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8080/api/v1/ai';

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/core/categories`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: CATALOG_CONSTANTS.CATEGORY_CACHE_REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch categories: ${res.statusText}`);
    }

    const data: CategoriesResponse = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('[API] Error fetching categories:', error);
    return [];
  }
}

export async function fetchProducts(
  params: ProductQueryParams = {},
  signal?: AbortSignal
): Promise<ProductsResponse> {
  const query = new URLSearchParams();

  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (params.manufacturer) {
    const mfg = Array.isArray(params.manufacturer)
      ? params.manufacturer.join(',')
      : params.manufacturer;
    query.set('manufacturer', mfg);
  }
  if (params.minPrice !== undefined) query.set('minPrice', params.minPrice.toString());
  if (params.maxPrice !== undefined) query.set('maxPrice', params.maxPrice.toString());
  if (params.sortBy) query.set('sortBy', params.sortBy);

  try {
    const res = await fetch(`${API_BASE_URL}/core/products?${query.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal,
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.statusText}`);
    }

    return await res.json();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        data: [],
        pagination: {
          page: 1,
          limit: CATALOG_CONSTANTS.DEFAULT_PAGE_SIZE,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
    console.error('[API] Error fetching products:', error);
    return {
      success: false,
      data: [],
      pagination: {
        page: 1,
        limit: CATALOG_CONSTANTS.DEFAULT_PAGE_SIZE,
        total: 0,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  }
}

export async function fetchProductByIdentifier(
  identifier: string
): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/core/products/${encodeURIComponent(identifier)}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch product: ${res.statusText}`);
    }

    const data: ProductDetailResponse = await res.json();
    return data.data || null;
  } catch (error) {
    console.error(`[API] Error fetching product ${identifier}:`, error);
    return null;
  }
}

export async function searchProductsSemantic(
  query: string,
  options: { limit?: number; category?: string; minScore?: number; signal?: AbortSignal } = {}
): Promise<Product[]> {
  const {
    limit = CATALOG_CONSTANTS.DEFAULT_AI_SEARCH_LIMIT,
    category,
    minScore = CATALOG_CONSTANTS.DEFAULT_AI_SIMILARITY_THRESHOLD,
    signal,
  } = options;

  const searchParams = new URLSearchParams({
    q: query,
    type: 'product',
    limit: limit.toString(),
  });
  if (category) {
    searchParams.set('category', category);
  }

  try {
    const res = await fetch(`${AI_BASE_URL}/search?${searchParams.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal,
    });

    if (!res.ok) {
      console.warn(`[AI Search] Search request returned status ${res.status}: ${res.statusText}`);
      return [];
    }

    const result: AiSearchResponse = await res.json();
    if (!result || !result.data) return [];

    const filteredItems = result.data.filter(
      (item) => item.similarity_score >= minScore
    );

    return filteredItems.map((item) => ({
      id: item.entity_id || item.id,
      sku: item.code,
      name: item.title,
      slug: item.metadata?.slug || item.code.toLowerCase(),
      manufacturer: item.metadata?.manufacturer || 'BuildStack Certified',
      description: item.metadata?.description || '',
      imageUrl: item.metadata?.imageUrl || item.metadata?.image_url || '',
      price: Number(item.metadata?.price) || 0,
      unit: item.metadata?.unit || 'piece',
      data: item.metadata?.specs || {},
      category: {
        id: item.category,
        name:
          item.metadata?.category_name ||
          (item.category
            ? item.category.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            : 'General'),
        slug: item.category || 'general',
      },
      similarityScore: item.similarity_score,
    }));
  } catch (error: any) {
    if (error.name === 'AbortError') return [];
    console.error('[AI Search] Failed to execute semantic search:', error);
    return [];
  }
}
