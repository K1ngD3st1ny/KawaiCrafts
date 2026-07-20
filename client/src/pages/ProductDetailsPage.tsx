import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Heart, ShoppingCart, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCartComponent from "@/components/ShoppingCart";
import HowItWorks from "@/components/HowItWorks";
import ProductCard from "@/components/ProductCard";
import ImageGallery from "@/components/ImageGallery";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { useWishlist, useWishlistMutations } from "@/hooks/useWishlist";
import { formatPrice } from "@/lib/currency";

export default function ProductDetailsPage() {
  const [, params] = useRoute("/product/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug ? decodeURIComponent(params.slug) : undefined;

  const cart = useCart();
  const { toast } = useToast();
  const { data: wishlist = [] } = useWishlist();
  const { toggleWishlist, addToWishlist, removeFromWishlist } = useWishlistMutations();

  // Fetch product and gallery images
  const { data, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const res = await fetch(`/api/products/${slug}`);
      if (!res.ok) throw new Error("Product not found");
      return res.json();
    },
    enabled: !!slug,
  });

  // Fetch recommendations
  const { data: recData, isLoading: isLoadingRecs } = useQuery({
    queryKey: ["product", data?.product?.id, "recommended"],
    queryFn: async () => {
      const res = await fetch(`/api/products/${data.product.id}/recommended`);
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      return res.json();
    },
    enabled: !!data?.product?.id,
  });

  const product = data?.product;
  const productImages = data?.productImages || [];

  useEffect(() => {
    if (product) {
      document.title = `${product.title} — Kawai Craft`;
    }
  }, [product]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <Skeleton className="aspect-square md:aspect-[4/5] rounded-xl" />
            <div className="space-y-6">
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full max-w-md rounded-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">The product you are looking for does not exist or is inactive.</p>
          <Button onClick={() => setLocation("/")}>Return to Home</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isWishlisted = wishlist.some((item: any) => item.productId === product.id);
  const isWishlistLoading = addToWishlist.isPending || removeFromWishlist.isPending;

  const handleAddToCart = () => {
    cart.addToCart({
      id: product.id,
      title: product.title,
      series: product.animeSeries,
      price: parseFloat(product.price),
      imageUrl: product.thumbnailUrl || "",
    });
    toast({
      title: "Added to cart",
      description: `${product.title} has been added to your cart.`,
    });
  };

  const handleBuyNow = () => {
    sessionStorage.setItem("buyNowItem", JSON.stringify({
      id: product.id,
      title: product.title,
      price: parseFloat(product.price),
      imageUrl: product.thumbnailUrl || "",
      quantity: 1
    }));
    setLocation("/checkout");
  };

  // Compile image list: thumbnail first, then gallery images
  const allImages = [
    ...(product.thumbnailUrl ? [product.thumbnailUrl] : []),
    ...productImages.map((img: any) => img.imageUrl)
  ];

  const getSeriesColor = (series: string) => {
    const colors: { [key: string]: string } = {
      "Demon Slayer": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "One Piece": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "Jujutsu Kaisen": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "Naruto": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      "Attack on Titan": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      "Dragon Ball": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "My Hero Academia": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "Chainsaw Man": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[series] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onCartClick={() => cart.setIsCartOpen(true)} />

      <main className="flex-1">
        {/* Breadcrumbs */}
        <div className="bg-muted/30 py-3 border-b">
          <div className="container mx-auto px-4 flex items-center text-sm text-muted-foreground gap-2 overflow-x-auto whitespace-nowrap">
            <button onClick={() => setLocation("/")} className="hover:text-primary transition-colors flex items-center gap-1">
              <Home className="w-3 h-3" /> Home
            </button>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            <button onClick={() => setLocation("/")} className="hover:text-primary transition-colors">
              {product.animeSeries}
            </button>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">
              {product.title}
            </span>
          </div>
        </div>

        {/* Product Details Section */}
        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Left: Gallery */}
            <div className="space-y-4 lg:w-10/12 xl:w-4/5 mx-auto w-full">
              <ImageGallery images={allImages} productName={product.title} />
            </div>

            {/* Right: Info */}
            <div className="flex flex-col space-y-6">
              <div>
                <Badge className={`mb-4 ${getSeriesColor(product.animeSeries)}`}>
                  {product.animeSeries}
                </Badge>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-2">
                  {product.title}
                </h1>
                
                <div className="text-3xl font-bold text-primary mt-4">
                  {formatPrice(parseFloat(product.price))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="flex-1 rounded-full text-base font-semibold"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <Button 
                  size="lg" 
                  className="flex-1 rounded-full text-base font-semibold"
                  onClick={handleBuyNow}
                >
                  Buy Now
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className={`rounded-full w-14 p-0 flex-shrink-0 border-2 ${isWishlisted ? "border-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20" : ""}`}
                  onClick={() => toggleWishlist(product.id, isWishlisted)}
                  disabled={isWishlistLoading}
                >
                  {isWishlistLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Heart className={`w-6 h-6 transition-colors ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                  )}
                </Button>
              </div>

              {/* Specifications */}
              <div className="grid grid-cols-2 gap-4 py-6 border-y text-sm">
                {product.characterName && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Character</span>
                    <span className="font-medium">{product.characterName}</span>
                  </div>
                )}
                {product.difficulty && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Difficulty</span>
                    <Badge variant="outline" className="capitalize">
                      {product.difficulty}
                    </Badge>
                  </div>
                )}
                {product.pageCount && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Pages</span>
                    <span className="font-medium">{product.pageCount} sheets</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="pt-2">
                  <h3 className="text-lg font-semibold mb-3">About this model</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
                    {product.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Recommended Products */}
        {(!isLoadingRecs && recData?.recommended?.length > 0) && (
          <section className="bg-muted/30 py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-heading font-bold mb-8 text-center">
                You Might Also Like
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recData.recommended.slice(0, 4).map((rec: any) => (
                  <ProductCard
                    key={rec.id}
                    id={rec.id}
                    title={rec.title}
                    slug={rec.slug}
                    series={rec.animeSeries}
                    price={parseFloat(rec.price)}
                    imageUrl={rec.thumbnailUrl}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* How It Works (Reused) */}
        <HowItWorks />
      </main>

      <Footer />
      <ShoppingCartComponent
        isOpen={cart.isCartOpen}
        onClose={() => cart.setIsCartOpen(false)}
      />
    </div>
  );
}
