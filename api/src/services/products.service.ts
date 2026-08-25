import { AppDataSource } from "../data-source";
import { Product } from "../entities";
import {
  FindOptionsWhere,
  FindOptionsOrder,
  ILike,
  In,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from "typeorm";

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  manufacturer?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price_asc" | "price_desc" | "name_asc" | "name_desc" | "newest";
}

export class ProductsService {
  private productRepo = AppDataSource.getRepository(Product);

  async getProducts(params: ProductQueryParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 12));
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Product> = {};

    // 1. Search by name using ILike
    if (params.search && params.search.trim()) {
      where.name = ILike(`%${params.search.trim()}%`);
    }

    // 2. Category Filter (by slug or id)
    if (params.category) {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          params.category,
        );
      if (isUuid) {
        where.category = { id: params.category };
      } else {
        where.category = { slug: params.category };
      }
    }

    // 3. Manufacturer Filter
    if (params.manufacturer) {
      const manufacturers = Array.isArray(params.manufacturer)
        ? params.manufacturer
        : params.manufacturer.split(",").map((m) => m.trim());
      where.manufacturer = In(manufacturers);
    }

    // 4. Price Filter
    if (params.minPrice !== undefined && params.maxPrice !== undefined) {
      where.price = Between(Number(params.minPrice), Number(params.maxPrice));
    } else if (params.minPrice !== undefined) {
      where.price = MoreThanOrEqual(Number(params.minPrice));
    } else if (params.maxPrice !== undefined) {
      where.price = LessThanOrEqual(Number(params.maxPrice));
    }

    // 5. Order
    const order: FindOptionsOrder<Product> = {};
    switch (params.sortBy) {
      case "price_asc":
        order.price = "ASC";
        break;
      case "price_desc":
        order.price = "DESC";
        break;
      case "name_asc":
        order.name = "ASC";
        break;
      case "name_desc":
        order.name = "DESC";
        break;
      case "newest":
      default:
        order.createdAt = "DESC";
        break;
    }

    const [products, total] = await this.productRepo.findAndCount({
      where,
      relations: { category: true },
      order,
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getProductByIdentifier(identifier: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identifier,
      );

    const product = await this.productRepo.findOne({
      where: isUuid
        ? { id: identifier }
        : [{ slug: identifier }, { sku: identifier }],
      relations: { category: true },
    });

    if (!product) {
      const error: any = new Error(`Product not found: ${identifier}`);
      error.status = 404;
      throw error;
    }

    return product;
  }
}

export const productsService = new ProductsService();
