interface SeriesData {
  name: string;
  imageUrl: string | null;
}

interface FeaturedSeriesProps {
  seriesData?: SeriesData[];
  onSeriesClick?: (seriesName: string) => void;
}

// Gradient fallback colors for series without images
const gradientMap: Record<string, string> = {
  "Demon Slayer": "from-red-500 to-orange-500",
  "One Piece": "from-blue-500 to-cyan-500",
  "Jujutsu Kaisen": "from-purple-500 to-pink-500",
  "Naruto": "from-orange-500 to-yellow-500",
  "Attack on Titan": "from-gray-600 to-gray-800",
  "Dragon Ball": "from-yellow-400 to-orange-400",
  "My Hero Academia": "from-green-500 to-emerald-500",
  "Chainsaw Man": "from-red-600 to-red-800",
};

const defaultGradient = "from-indigo-500 to-purple-500";

export default function FeaturedSeries({
  seriesData,
  onSeriesClick,
}: FeaturedSeriesProps) {
  if (!seriesData || seriesData.length === 0) return null;

  const handleSeriesClick = (seriesName: string) => {
    if (onSeriesClick) {
      onSeriesClick(seriesName);
    }
  };

  return (
    <section className="pt-12 pb-8 px-4">
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
            className="flex gap-8 overflow-x-auto pb-4 justify-center flex-wrap"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {seriesData.map((series) => {
              const id = series.name.toLowerCase().replace(/\s+/g, "-");
              const gradient = gradientMap[series.name] || defaultGradient;

              return (
                <button
                  key={series.name}
                  className="flex flex-col items-center gap-3 group cursor-pointer bg-transparent border-none p-2 transition-transform duration-300 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
                  onClick={() => handleSeriesClick(series.name)}
                  data-testid={`card-series-${id}`}
                  type="button"
                >
                  {/* Circular Image Container */}
                  <div
                    className="relative w-24 h-24 rounded-full overflow-hidden ring-3 ring-transparent group-hover:ring-primary/60 transition-all duration-300 shadow-md group-hover:shadow-xl group-hover:shadow-primary/20"
                  >
                    {series.imageUrl ? (
                      <img
                        src={series.imageUrl}
                        alt={series.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient}`}
                      >
                        <span className="text-2xl font-bold text-white drop-shadow-sm">
                          {series.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Hover Glow Overlay */}
                    <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                  </div>

                  {/* Series Name */}
                  <span
                    className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300 max-w-[100px] text-center leading-tight"
                    data-testid={`text-series-${id}`}
                  >
                    {series.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}