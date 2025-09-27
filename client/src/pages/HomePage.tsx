import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedSeries from "@/components/FeaturedSeries";
import ProductGrid from "@/components/ProductGrid";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import gojoImage from "@assets/generated_images/Gojo_papercraft_catalog_cover_e7750298.png";
import nezukoImage from "@assets/generated_images/Nezuko_papercraft_catalog_cover_b8ac34f4.png";
import luffyImage from "@assets/generated_images/Luffy_Gear_5_papercraft_cover_0411a1aa.png";

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
  series: string;
  price: number;
  imageUrl: string;
  popularity: number;
  releaseDate: string;
}

export default function HomePage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  //todo: remove mock functionality
  const sampleProducts: Product[] = [
    {
      id: "gojo-infinity",
      title: "Gojo Satoru - Infinity Form",
      series: "Jujutsu Kaisen", 
      price: 4.99,
      imageUrl: gojoImage,
      popularity: 95,
      releaseDate: "2024-01-15",
    },
    {
      id: "nezuko-chibi",
      title: "Nezuko - Chibi Form",
      series: "Demon Slayer",
      price: 3.99,
      imageUrl: nezukoImage,
      popularity: 88,
      releaseDate: "2024-01-10",
    },
    {
      id: "luffy-gear5",
      title: "Luffy - Gear 5",
      series: "One Piece",
      price: 5.99,
      imageUrl: luffyImage,
      popularity: 92,
      releaseDate: "2024-01-20",
    },
    {
      id: "gojo-regular",
      title: "Gojo Satoru - Regular Form",
      series: "Jujutsu Kaisen",
      price: 3.99,
      imageUrl: gojoImage,
      popularity: 85,
      releaseDate: "2024-01-05",
    },
    {
      id: "tanjiro-water",
      title: "Tanjiro - Water Breathing",
      series: "Demon Slayer",
      price: 4.49,
      imageUrl: nezukoImage,
      popularity: 90,
      releaseDate: "2024-01-12",
    },
    {
      id: "zoro-swords",
      title: "Roronoa Zoro - Three Swords",
      series: "One Piece",
      price: 5.49,
      imageUrl: luffyImage,
      popularity: 87,
      releaseDate: "2024-01-18",
    },
    {
      id: "yuji-black-flash",
      title: "Yuji Itadori - Black Flash",
      series: "Jujutsu Kaisen",
      price: 4.49,
      imageUrl: gojoImage,
      popularity: 82,
      releaseDate: "2024-01-08",
    },
    {
      id: "inosuke-beast",
      title: "Inosuke - Beast Breathing",
      series: "Demon Slayer", 
      price: 4.29,
      imageUrl: nezukoImage,
      popularity: 86,
      releaseDate: "2024-01-14",
    },
  ];

  const handleAddToCart = (productId: string) => {
    const product = sampleProducts.find(p => p.id === productId);
    if (!product) return;

    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === productId);
      if (existingItem) {
        return prev.map(item =>
          item.id === productId 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, {
          id: product.id,
          title: product.title,
          series: product.series,
          price: product.price,
          quantity: 1,
          imageUrl: product.imageUrl,
        }];
      }
    });
    
    console.log(`Added ${product.title} to cart`);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleCartOpen = () => {
    setIsCartOpen(true);
  };

  const handleExploreClick = () => {
    // Scroll to products section
    const productsSection = document.querySelector('[data-testid="grid-products"]');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSeriesClick = (seriesId: string) => {
    // Scroll to products and filter by series would be handled here
    const productsSection = document.querySelector('[data-testid="grid-products"]');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    alert("Redirecting to secure checkout... (Demo functionality)");
  };

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header 
        cartItemCount={totalCartItems}
        onCartClick={handleCartOpen}
        onSearchSubmit={(query) => console.log("Search:", query)}
      />
      
      <main>
        <Hero onExploreClick={handleExploreClick} />
        <FeaturedSeries onSeriesClick={handleSeriesClick} />
        <ProductGrid 
          products={sampleProducts}
          onAddToCart={handleAddToCart}
          hasMore={false}
        />
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