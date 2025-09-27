import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SeriesItem {
  id: string;
  name: string;
  color: string;
  textColor: string;
}

interface FeaturedSeriesProps {
  onSeriesClick?: (seriesId: string) => void;
}

export default function FeaturedSeries({ onSeriesClick }: FeaturedSeriesProps) {
  //todo: remove mock functionality
  const featuredSeries: SeriesItem[] = [
    { id: "demon-slayer", name: "Demon Slayer", color: "bg-gradient-to-r from-red-500 to-orange-500", textColor: "text-white" },
    { id: "one-piece", name: "One Piece", color: "bg-gradient-to-r from-blue-500 to-cyan-500", textColor: "text-white" },
    { id: "jujutsu-kaisen", name: "Jujutsu Kaisen", color: "bg-gradient-to-r from-purple-500 to-pink-500", textColor: "text-white" },
    { id: "naruto", name: "Naruto", color: "bg-gradient-to-r from-orange-500 to-yellow-500", textColor: "text-white" },
    { id: "attack-on-titan", name: "Attack on Titan", color: "bg-gradient-to-r from-gray-600 to-gray-800", textColor: "text-white" },
    { id: "dragon-ball", name: "Dragon Ball", color: "bg-gradient-to-r from-yellow-400 to-orange-400", textColor: "text-black" },
    { id: "my-hero-academia", name: "My Hero Academia", color: "bg-gradient-to-r from-green-500 to-emerald-500", textColor: "text-white" },
    { id: "chainsaw-man", name: "Chainsaw Man", color: "bg-gradient-to-r from-red-600 to-red-800", textColor: "text-white" },
  ];

  const handleSeriesClick = (seriesId: string) => {
    if (onSeriesClick) {
      onSeriesClick(seriesId);
    }
    console.log(`Series clicked: ${seriesId}`);
  };

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        <h2 
          className="text-3xl font-heading font-bold text-center mb-8"
          data-testid="section-title-featured-series"
        >
          Featured Anime Series
        </h2>
        
        <div className="relative">
          {/* Horizontal Scrolling Container */}
          <div 
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {featuredSeries.map((series) => (
              <Card
                key={series.id}
                className="flex-shrink-0 w-48 h-28 overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-lg hover-elevate"
                onClick={() => handleSeriesClick(series.id)}
                data-testid={`card-series-${series.id}`}
              >
                <CardContent className="p-0 h-full">
                  <div className={`h-full flex items-center justify-center ${series.color} ${series.textColor} transition-transform duration-300 group-hover:scale-105`}>
                    <h3 
                      className="text-lg font-heading font-bold text-center px-4 drop-shadow-sm"
                      data-testid={`text-series-${series.id}`}
                    >
                      {series.name}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Scroll Indicators */}
          <div className="flex justify-center mt-4 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => document.querySelector('.overflow-x-auto')?.scrollBy({ left: -200, behavior: 'smooth' })}
              data-testid="button-scroll-left"
            >
              ← Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => document.querySelector('.overflow-x-auto')?.scrollBy({ left: 200, behavior: 'smooth' })}
              data-testid="button-scroll-right"
            >
              Next →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}