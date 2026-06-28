import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedSeries from "@/components/FeaturedSeries";
import ProductGrid from "@/components/ProductGrid";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import { Skeleton } from "@/components/ui/skeleton";

interface CartItem {
  id: string;
  title: string;
  series: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  animeSeries: string;
  characterName: string;
  difficulty: string;
  pageCount: number;
  price: string;
  thumbnailUrl: string | null;
  pdfUrl: string | null;
  featured: boolean;
  active: boolean;
  popularity: number;
  createdAt: string;
  updatedAt: string;
}

export default function HomePage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [seriesList, setSeriesList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("");
  const [sortBy, setSortBy] = useState("popularity");

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedSeries) params.set("series", selectedSeries);
      if (sortBy) params.set("sort", sortBy);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products || []);
      setSeriesList(data.series || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedSeries, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Map API products to the format expected by ProductGrid
  const mappedProducts = products.map((p) => ({
    id: p.id,
    title: p.title,
    series: p.animeSeries,
    price: parseFloat(p.price),
    imageUrl: p.thumbnailUrl || "",
    popularity: p.popularity,
    releaseDate: p.createdAt,
    description: p.description,
    characterName: p.characterName,
    difficulty: p.difficulty,
    slug: p.slug,
  }));

  const handleAddToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === productId);
      if (existingItem) {
        return prev.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prev,
          {
            id: product.id,
            title: product.title,
            series: product.animeSeries,
            price: parseFloat(product.price),
            quantity: 1,
            imageUrl: product.thumbnailUrl || "",
          },
        ];
      }
    });

    console.log(`Added ${product.title} to cart`);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleCartOpen = () => {
    setIsCartOpen(true);
  };

  const handleExploreClick = () => {
    const productsSection = document.querySelector(
      '[data-testid="grid-products"]'
    );
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSeriesClick = (seriesName: string) => {
    setSelectedSeries(seriesName);
    const productsSection = document.querySelector(
      '[data-testid="grid-products"]'
    );
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const handleSeriesFilter = (series: string) => {
    setSelectedSeries(series);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
  };

  const totalCartItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <Header
        cartItemCount={totalCartItems}
        onCartClick={handleCartOpen}
        onSearchSubmit={handleSearchSubmit}
      />

      <main>
        <Hero onExploreClick={handleExploreClick} />
        <FeaturedSeries
          seriesList={seriesList}
          onSeriesClick={handleSeriesClick}
        />

        {isLoading ? (
          <section className="py-12 px-4">
            <div className="container mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-20 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <ProductGrid
            products={mappedProducts}
            onAddToCart={handleAddToCart}
            hasMore={false}
            seriesList={seriesList}
            selectedSeries={selectedSeries}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            onSeriesFilter={handleSeriesFilter}
          />
        )}

        <HowItWorks />
      </main>

      <Footer />

      <ShoppingCart
        items={cartItems}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />
    </div>
  );
}