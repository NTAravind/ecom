import prisma from "@/lib/prisma";
import { ProductCard } from "@/app/components/ProductCard";
import { Suspense } from "react";

interface SearchParams {
  categories?: string;
  weights?: string;
}

async function GetPopularProducts() {
  const data = await prisma.product.findMany({
    where: { Shown: true },
    orderBy: {
      orderItems: {
        _count: "desc"
      }
    },
    take: 10
  });
  return data;
}

async function GetProducts(filters: {
  categories?: string[];
  weights?: string[];
}) {
  const { categories, weights } = filters;

  const data = await prisma.product.findMany({
    where: {
      Shown: true,
      ...(categories && categories.length > 0 && {
        category: { in: categories }
      }),
      ...(weights && weights.length > 0 && {
        y_weight: { in: weights }
      }),
    }
  });

  return data;
}

function FilteredProductsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-64"></div>
      ))}
    </div>
  );
}

async function FilteredProducts({
  categories,
  weights,
}: {
  categories?: string[];
  weights?: string[];
}) {
  const hasFilters =
    (categories && categories.length > 0) || (weights && weights.length > 0);

  if (!hasFilters) {
    const newProductData = await GetProducts({});
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">All Products</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {newProductData.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      </div>
    );
  }

  const filteredProducts = await GetProducts({ categories, weights });

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Filtered Products</h1>
        <p className="text-gray-600">
          {filteredProducts.length} product
          {filteredProducts.length !== 1 ? "s" : ""} found
          {categories && categories.length > 0 && (
            <span> in categories: {categories.join(", ")}</span>
          )}
          {weights && weights.length > 0 && (
            <span> with weights: {weights.join(", ")}</span>
          )}
        </p>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-3">
          {filteredProducts.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">Try adjusting your filters to see more results.</p>
        </div>
      )}
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const popularProductData = await GetPopularProducts();

  const params = await searchParams;
  const categories = params.categories?.split(",").filter(Boolean);
  const weights = params.weights?.split(",").filter(Boolean);
  const hasFilters =
    (categories && categories.length > 0) || (weights && weights.length > 0);

  return (
    <div className="space-y-8">
      {!hasFilters && (
        <section>
          <h1 className="text-2xl font-bold mb-6">Most Popular Products</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {popularProductData.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        </section>
      )}

      <section>
        <Suspense fallback={<FilteredProductsLoading />}>
          <FilteredProducts categories={categories} weights={weights} />
        </Suspense>
      </section>
    </div>
  );
}