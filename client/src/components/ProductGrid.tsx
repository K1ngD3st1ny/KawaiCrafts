import { useState } from "react";
import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Product {
  id: string;
  title: string;
  series: string;
  price: number;
  imageUrl: string;
  popularity: number;
  releaseDate: string;
}

interface ProductGridProps {
  products: Product[];
  onAddToCart?: (productId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function ProductGrid({ 
  products, 
  onAddToCart, 
  onLoadMore, 
  hasMore = false 
}: ProductGridProps) {
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("popularity");

  const allSeries = Array.from(new Set(products.map(p => p.series))).sort();

  const filteredAndSortedProducts = products
    .filter(product => 
      selectedSeries.length === 0 || selectedSeries.includes(product.series)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "popularity":
          return b.popularity - a.popularity;
        case "newest":
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        default:
          return 0;
      }
    });

  const handleSeriesToggle = (series: string, checked: boolean) => {
    if (checked) {
      setSelectedSeries(prev => [...prev, series]);
    } else {
      setSelectedSeries(prev => prev.filter(s => s !== series));
    }
    console.log(`Series filter toggled: ${series} - ${checked}`);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    console.log(`Sort changed to: ${value}`);
  };

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="space-y-6">
              {/* Sort Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sort By</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger data-testid="select-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popularity">Popularity</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Series Filter */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filter by Series</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allSeries.map((series) => (
                      <div key={series} className="flex items-center space-x-2">
                        <Checkbox
                          id={series}
                          checked={selectedSeries.includes(series)}
                          onCheckedChange={(checked) => 
                            handleSeriesToggle(series, checked as boolean)
                          }
                          data-testid={`checkbox-series-${series.toLowerCase().replace(/\s+/g, "-")}`}
                        />
                        <label
                          htmlFor={series}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {series}
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  {selectedSeries.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSeries([])}
                      className="w-full mt-4"
                      data-testid="button-clear-filters"
                    >
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-2xl font-heading font-bold"
                data-testid="text-results-title"
              >
                {selectedSeries.length > 0 
                  ? `${selectedSeries.join(", ")} Papercraft` 
                  : "All Papercraft"
                }
              </h2>
              <span 
                className="text-muted-foreground"
                data-testid="text-results-count"
              >
                {filteredAndSortedProducts.length} results
              </span>
            </div>

            {/* Products Grid */}
            {filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4" data-testid="text-no-results">
                  No products found matching your filters
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedSeries([])}
                  data-testid="button-reset-filters"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <>
                <div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
                  data-testid="grid-products"
                >
                  {filteredAndSortedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      {...product}
                      onAddToCart={onAddToCart}
                    />
                  ))}
                </div>

                {/* Load More */}
                {hasMore && onLoadMore && (
                  <div className="text-center">
                    <Button 
                      onClick={onLoadMore}
                      size="lg"
                      variant="outline"
                      data-testid="button-load-more"
                    >
                      Load More Products
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}