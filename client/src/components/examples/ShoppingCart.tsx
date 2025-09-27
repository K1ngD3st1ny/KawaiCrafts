import { useState } from 'react';
import ShoppingCart from '../ShoppingCart';
import { Button } from '@/components/ui/button';
import gojoImage from "@assets/generated_images/Gojo_papercraft_catalog_cover_e7750298.png";
import nezukoImage from "@assets/generated_images/Nezuko_papercraft_catalog_cover_b8ac34f4.png";

export default function ShoppingCartExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState([
    //todo: remove mock functionality
    {
      id: "gojo-infinity",
      title: "Gojo Satoru - Infinity Form",
      series: "Jujutsu Kaisen",
      price: 4.99,
      quantity: 1,
      imageUrl: gojoImage,
    },
    {
      id: "nezuko-chibi",
      title: "Nezuko - Chibi Form", 
      series: "Demon Slayer",
      price: 3.99,
      quantity: 2,
      imageUrl: nezukoImage,
    },
  ]);

  return (
    <div className="p-6">
      <Button onClick={() => setIsOpen(true)}>
        Open Cart ({items.reduce((sum, item) => sum + item.quantity, 0)})
      </Button>
      
      <ShoppingCart
        items={items}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onUpdateQuantity={(itemId, quantity) => {
          setItems(prev => prev.map(item => 
            item.id === itemId ? { ...item, quantity } : item
          ));
        }}
        onRemoveItem={(itemId) => {
          setItems(prev => prev.filter(item => item.id !== itemId));
        }}
        onCheckout={() => console.log('Checkout triggered')}
      />
    </div>
  );
}