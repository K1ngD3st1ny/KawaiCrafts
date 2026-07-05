import { useState } from "react";
import { formatPrice } from "@/lib/currency";
import { Plus, ShoppingCart, Package, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useWishlist, useWishlistMutations } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  id: string;
  title: string;
  series: string;
  price: number;
  imageUrl: string;
  onAddToCart?: (productId: string) => void;
}

export default function ProductCard({ 
  id, 
  title, 
  series, 
  price, 
  imageUrl, 
  onAddToCart 
}: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { data: wishlist = [] } = useWishlist();
  const { toggleWishlist, addToWishlist, removeFromWishlist } = useWishlistMutations();
  const cart = useCart();
  const { toast } = useToast();

  const isWishlisted = wishlist.some((item) => item.productId === id);
  const isWishlistLoading = addToWishlist.isPending || removeFromWishlist.isPending;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(id, isWishlisted);
  };

  const handleAddToCart = () => {
    if (isAdding) return; // Prevent duplicate clicks

    setIsAdding(true);

    cart.addToCart({
      id,
      title,
      series,
      price,
      imageUrl,
    });

    // Call optional parent callback for any extra side effects
    if (onAddToCart) {
      onAddToCart(id);
    }

    toast({
      title: "Added to cart",
      description: `${title} has been added to your cart.`,
    });

    // Brief visual feedback then re-enable
    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

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
    <Card 
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover-elevate"
      data-testid={`card-product-${id}`}
    >
      <CardContent className="p-0">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              data-testid={`img-product-${id}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Wishlist Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleWishlistClick}
            disabled={isWishlistLoading}
            className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all duration-300 shadow-sm
              ${
                isWishlisted
                  ? "bg-white/90 text-red-500 opacity-100"
                  : "bg-black/20 text-white opacity-0 group-hover:opacity-100 hover:bg-black/40 dark:bg-black/40 dark:hover:bg-black/60"
              }
            `}
            data-testid={`button-wishlist-${id}`}
          >
            <Heart 
              className={`w-5 h-5 transition-all duration-300 ${isWishlisted ? "fill-current" : ""}`} 
            />
          </motion.button>

          {/* Quick Add Button */}
          <Button
            size="icon"
            onClick={handleAddToCart}
            disabled={isAdding}
            className="absolute top-3 right-14 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-primary hover:bg-primary/90 rounded-full shadow-lg z-10"
            data-testid={`button-quick-add-${id}`}
          >
            {isAdding ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Series Badge */}
          <Badge 
            className={`mb-2 text-xs ${getSeriesColor(series)}`}
            data-testid={`badge-series-${id}`}
          >
            {series}
          </Badge>

          {/* Title */}
          <h3 
            className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors"
            data-testid={`text-title-${id}`}
          >
            {title}
          </h3>

          {/* Price and Add to Cart */}
          <div className="flex items-center justify-between">
            <span 
              className="text-xl font-bold text-primary"
              data-testid={`text-price-${id}`}
            >
              {formatPrice(price)}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToCart}
              disabled={isAdding}
              className="rounded-full hover-elevate"
              data-testid={`button-add-cart-${id}`}
            >
              {isAdding ? (
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <ShoppingCart className="h-3 w-3 mr-2" />
              )}
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}