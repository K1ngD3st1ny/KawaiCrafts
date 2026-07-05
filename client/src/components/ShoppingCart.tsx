import { useState } from "react";
import { formatPrice } from "@/lib/currency";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLocation } from "wouter";
import { useCart } from "@/hooks/useCart";

interface ShoppingCartProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCheckout?: () => void;
  trigger?: React.ReactNode;
}

export default function ShoppingCart({
  isOpen = false,
  onClose,
  onCheckout,
  trigger
}: ShoppingCartProps) {
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  const [, setLocation] = useLocation();
  const cart = useCart();

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setProcessingItems(prev => new Set(Array.from(prev).concat(itemId)));
    
    if (newQuantity === 0) {
      cart.removeFromCart(itemId);
    } else {
      cart.updateQuantity(itemId, newQuantity);
    }
    
    setTimeout(() => {
      setProcessingItems(prev => {
        const next = new Set(Array.from(prev));
        next.delete(itemId);
        return next;
      });
    }, 300);
  };

  const handleRemoveItem = (itemId: string) => {
    cart.removeFromCart(itemId);
  };

  const handleCheckout = () => {
    if (onClose) {
      onClose();
    }
    setLocation("/checkout");
    if (onCheckout) {
      onCheckout();
    }
  };

  const CartContent = () => (
    <div className="flex flex-col h-full">
      <SheetHeader>
        <SheetTitle className="flex items-center justify-between">
          Shopping Cart
          <Badge variant="secondary" data-testid="badge-cart-item-count">
            {cart.totalItems} items
          </Badge>
        </SheetTitle>
        <SheetDescription>
          Review your anime papercraft collection
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-auto py-6">
        {cart.cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-muted-foreground mb-2" data-testid="text-empty-cart">
              Your cart is empty
            </p>
            <p className="text-sm text-muted-foreground">
              Add some amazing papercraft to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.cartItems.map((item) => (
              <Card key={item.id} className="overflow-hidden" data-testid={`cart-item-${item.id}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-16 h-20 flex-shrink-0 overflow-hidden rounded-md">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        data-testid={`img-cart-${item.id}`}
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-sm leading-tight mb-1" data-testid={`text-cart-title-${item.id}`}>
                            {item.title}
                          </h4>
                          <Badge variant="outline" className="text-xs" data-testid={`badge-cart-series-${item.id}`}>
                            {item.series}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Quantity and Price */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={processingItems.has(item.id) || item.quantity <= 1}
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span 
                            className="w-8 text-center font-medium"
                            data-testid={`text-quantity-${item.id}`}
                          >
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={processingItems.has(item.id)}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold" data-testid={`text-item-total-${item.id}`}>
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(item.price)} each
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cart Footer */}
      {cart.cartItems.length > 0 && (
        <div className="border-t pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Subtotal:</span>
            <span className="text-2xl font-bold text-primary" data-testid="text-subtotal">
              {formatPrice(cart.subtotal)}
            </span>
          </div>
          
          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckout}
            data-testid="button-checkout"
          >
            Proceed to Checkout
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Instant digital download after payment
          </p>
        </div>
      )}
    </div>
  );

  if (trigger) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetTrigger asChild>
          {trigger}
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg">
          <CartContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <CartContent />
      </SheetContent>
    </Sheet>
  );
}