import { useState } from 'react';
import ShoppingCart from '../ShoppingCart';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';

export default function ShoppingCartExample() {
  const [isOpen, setIsOpen] = useState(false);
  const cart = useCart();

  return (
    <div className="p-6">
      <Button onClick={() => setIsOpen(true)}>
        Open Cart ({cart.totalItems})
      </Button>
      
      <ShoppingCart
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCheckout={() => console.log('Checkout triggered')}
      />
    </div>
  );
}