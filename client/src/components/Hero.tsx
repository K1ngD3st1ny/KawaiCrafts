import { Button } from "@/components/ui/button";
import heroImage from "@assets/generated_images/Chibi_anime_characters_crafting_bdc5484d.png";

interface HeroProps {
  onExploreClick?: () => void;
}

export default function Hero({ onExploreClick }: HeroProps) {
  const handleExploreClick = () => {
    if (onExploreClick) {
      onExploreClick();
    }
    console.log("Explore Catalogues clicked");
  };

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1
          className="text-5xl md:text-7xl font-heading font-bold text-white mb-6 drop-shadow-lg"
          data-testid="hero-title"
        >
          Kawai Craft
        </h1>
        <h2
          className="text-xl md:text-3xl font-heading font-medium text-white/90 mb-8 drop-shadow-md"
          data-testid="hero-tagline"
        >
          Cut, Craft, Collect – Your Anime Figures Await
        </h2>
        <Button
          size="lg"
          variant="accent"
          onClick={handleExploreClick}
          className="font-bold text-lg px-8 py-6 rounded-full"
          data-testid="button-explore-catalogues"
        >
          Explore Catalogues
        </Button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}