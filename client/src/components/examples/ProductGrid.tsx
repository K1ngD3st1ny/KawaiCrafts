import ProductGrid from '../ProductGrid';
import gojoImage from "@assets/generated_images/Gojo_papercraft_catalog_cover_e7750298.png";
import nezukoImage from "@assets/generated_images/Nezuko_papercraft_catalog_cover_b8ac34f4.png";
import luffyImage from "@assets/generated_images/Luffy_Gear_5_papercraft_cover_0411a1aa.png";

export default function ProductGridExample() {
  //todo: remove mock functionality
  const sampleProducts = [
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
    // Duplicate entries to show filtering
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
      imageUrl: nezukoImage, // Using as placeholder
      popularity: 90,
      releaseDate: "2024-01-12",
    },
    {
      id: "zoro-swords",
      title: "Roronoa Zoro - Three Swords",
      series: "One Piece",
      price: 5.49,
      imageUrl: luffyImage, // Using as placeholder
      popularity: 87,
      releaseDate: "2024-01-18",
    },
  ];

  return (
    <ProductGrid
      products={sampleProducts}
      onAddToCart={(id) => console.log(`Added product ${id} to cart`)}
      onLoadMore={() => console.log('Load more triggered')}
      hasMore={true}
    />
  );
}