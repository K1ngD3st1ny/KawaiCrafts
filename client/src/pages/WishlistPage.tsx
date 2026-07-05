import { useLocation } from "wouter";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { HeartCrack, ShoppingCart } from "lucide-react";

export default function WishlistPage() {
  const { data: wishlist = [], isLoading, error } = useWishlist();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();

  // If not authenticated and auth has finished loading, redirect to login
  if (!isAuthLoading && !isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-heading font-bold mb-8">My Wishlist</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load wishlist.</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-24 px-4 bg-muted/30 rounded-2xl border border-dashed">
            <div className="bg-background w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <HeartCrack className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Looks like you haven't saved any items yet. Start exploring our collection and find your next favorite craft!
            </p>
            <Button size="lg" onClick={() => setLocation("/")}>
              Explore Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <ProductCard
                key={item.productId}
                id={item.product.id}
                title={item.product.title}
                series={item.product.animeSeries}
                price={Number(item.product.price)}
                imageUrl={item.product.thumbnailUrl || ""}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
