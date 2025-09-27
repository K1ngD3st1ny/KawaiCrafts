import { useState } from "react";
import { Plus, ShoppingCart } from "lucide-react";
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

  const handleAddToCart = async () => {
    setIsAdding(true);
    if (onAddToCart) {
      onAddToCart(id);
    }
    console.log(`Added ${title} to cart`);
    
    // Simulate API call
    setTimeout(() => {
      setIsAdding(false);
    }, 800);
  };

  const getSeriesColor = (series: string) => {
    const colors: { [key: string]: string } = {
      "Demon Slayer": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "One Piece": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "Jujutsu Kaisen": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "Naruto": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
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
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-testid={`img-product-${id}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Quick Add Button */}
          <Button
            size="icon"
            onClick={handleAddToCart}
            disabled={isAdding}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-primary hover:bg-primary/90 rounded-full shadow-lg"
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
              ${price.toFixed(2)}
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