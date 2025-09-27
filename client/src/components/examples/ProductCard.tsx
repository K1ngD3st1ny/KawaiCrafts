import ProductCard from '../ProductCard';
import gojoImage from "@assets/generated_images/Gojo_papercraft_catalog_cover_e7750298.png";
import nezukoImage from "@assets/generated_images/Nezuko_papercraft_catalog_cover_b8ac34f4.png";
import luffyImage from "@assets/generated_images/Luffy_Gear_5_papercraft_cover_0411a1aa.png";

export default function ProductCardExample() {
  //todo: remove mock functionality
  const sampleProducts = [
    {
      id: "gojo-infinity",
      title: "Gojo Satoru - Infinity Form",
      series: "Jujutsu Kaisen",
      price: 4.99,
      imageUrl: gojoImage,
    },
    {
      id: "nezuko-chibi",
      title: "Nezuko - Chibi Form",
      series: "Demon Slayer",
      price: 3.99,
      imageUrl: nezukoImage,
    },
    {
      id: "luffy-gear5",
      title: "Luffy - Gear 5",
      series: "One Piece",
      price: 5.99,
      imageUrl: luffyImage,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {sampleProducts.map((product) => (
        <ProductCard
          key={product.id}
          {...product}
          onAddToCart={(id) => console.log(`Added product ${id} to cart`)}
        />
      ))}
    </div>
  );
}