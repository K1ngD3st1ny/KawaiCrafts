import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FeaturedSeriesProps {
  seriesList?: string[];
  onSeriesClick?: (seriesName: string) => void;
}

// Color map for known anime series
const seriesStyles: Record<string, { color: string; textColor: string }> = {
  "Demon Slayer": { color: "bg-gradient-to-r from-red-500 to-orange-500", textColor: "text-white" },
  "One Piece": { color: "bg-gradient-to-r from-blue-500 to-cyan-500", textColor: "text-white" },
  "Jujutsu Kaisen": { color: "bg-gradient-to-r from-purple-500 to-pink-500", textColor: "text-white" },
  "Naruto": { color: "bg-gradient-to-r from-orange-500 to-yellow-500", textColor: "text-white" },
  "Attack on Titan": { color: "bg-gradient-to-r from-gray-600 to-gray-800", textColor: "text-white" },
  "Dragon Ball": { color: "bg-gradient-to-r from-yellow-400 to-orange-400", textColor: "text-black" },
  "My Hero Academia": { color: "bg-gradient-to-r from-green-500 to-emerald-500", textColor: "text-white" },
  "Chainsaw Man": { color: "bg-gradient-to-r from-red-600 to-red-800", textColor: "text-white" },
};

const defaultStyle = {
  color: "bg-gradient-to-r from-indigo-500 to-purple-500",
  textColor: "text-white",
};

// Fallback series list used when no products exist in the DB yet
const fallbackSeries = [
  "Demon Slayer", "One Piece", "Jujutsu Kaisen", "Naruto",
  "Attack on Titan", "Dragon Ball", "My Hero Academia", "Chainsaw Man",
];

export default function FeaturedSeries({
  seriesList,
  onSeriesClick,
}: FeaturedSeriesProps) {
  const displaySeries = seriesList && seriesList.length > 0 ? seriesList : fallbackSeries;

  const handleSeriesClick = (seriesName: string) => {
    if (onSeriesClick) {
      onSeriesClick(seriesName);
    }
    console.log(`Series clicked: ${seriesName}`);
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
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {displaySeries.map((series) => {
              const style = seriesStyles[series] || defaultStyle;
              const id = series.toLowerCase().replace(/\s+/g, "-");

              return (
                <Card
                  key={series}
                  className="flex-shrink-0 w-48 h-28 overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-lg hover-elevate"
                  onClick={() => handleSeriesClick(series)}
                  data-testid={`card-series-${id}`}
                >
                  <CardContent className="p-0 h-full">
                    <div
                      className={`h-full flex items-center justify-center ${style.color} ${style.textColor} transition-transform duration-300 group-hover:scale-105`}
                    >
                      <h3
                        className="text-lg font-heading font-bold text-center px-4 drop-shadow-sm"
                        data-testid={`text-series-${id}`}
                      >
                        {series}
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Scroll Indicators */}
          <div className="flex justify-center mt-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                document
                  .querySelector(".overflow-x-auto")
                  ?.scrollBy({ left: -200, behavior: "smooth" })
              }
              data-testid="button-scroll-left"
            >
              ← Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                document
                  .querySelector(".overflow-x-auto")
                  ?.scrollBy({ left: 200, behavior: "smooth" })
              }
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