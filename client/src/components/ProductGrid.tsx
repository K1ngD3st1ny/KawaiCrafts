import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  seriesList?: string[];
  selectedSeries?: string;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  onSeriesFilter?: (series: string) => void;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  totalProducts?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onPageChange?: (page: number) => void;
}

export default function ProductGrid({
  products,
  onAddToCart,
  seriesList = [],
  selectedSeries = "",
  sortBy = "popularity",
  onSortChange,
  onSeriesFilter,
  currentPage = 1,
  totalPages = 1,
  totalProducts = 0,
  hasNextPage = false,
  hasPreviousPage = false,
  onPageChange,
}: ProductGridProps) {
  // Use provided series list from API, or extract from local products as fallback
  const allSeries =
    seriesList.length > 0
      ? seriesList
      : Array.from(new Set(products.map((p) => p.series))).sort();

  const handleSeriesToggle = (series: string, checked: boolean) => {
    if (onSeriesFilter) {
      onSeriesFilter(checked ? series : "");
    }
    console.log(`Series filter toggled: ${series} - ${checked}`);
  };

  const handleSortChange = (value: string) => {
    if (onSortChange) {
      onSortChange(value);
    }
    console.log(`Sort changed to: ${value}`);
  };

  const handleClearFilters = () => {
    if (onSeriesFilter) {
      onSeriesFilter("");
    }
  };

  const handlePreviousPage = () => {
    if (hasPreviousPage && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage && onPageChange) {
      onPageChange(currentPage + 1);
    }
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
                  <Select
                    value={sortBy}
                    onValueChange={handleSortChange}
                  >
                    <SelectTrigger data-testid="select-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popularity">Popularity</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price-low">
                        Price: Low to High
                      </SelectItem>
                      <SelectItem value="price-high">
                        Price: High to Low
                      </SelectItem>
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
                      <div
                        key={series}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={series}
                          checked={selectedSeries === series}
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

                  {selectedSeries && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearFilters}
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
                {selectedSeries
                  ? `${selectedSeries} Papercraft`
                  : "All Papercraft"}
              </h2>
              <span
                className="text-muted-foreground"
                data-testid="text-results-count"
              >
                {totalProducts} {totalProducts === 1 ? "result" : "results"}
              </span>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="text-center py-12">
                <p
                  className="text-muted-foreground mb-4"
                  data-testid="text-no-results"
                >
                  No products found matching your filters
                </p>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
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
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      {...product}
                      onAddToCart={onAddToCart}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div
                    className="flex items-center justify-center gap-4 pt-4 pb-2"
                    data-testid="pagination-controls"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={!hasPreviousPage}
                      className="gap-1"
                      data-testid="button-previous-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>

                    <span
                      className="text-sm font-medium text-muted-foreground select-none"
                      data-testid="text-page-info"
                    >
                      Page{" "}
                      <span className="text-foreground font-semibold">
                        {currentPage}
                      </span>{" "}
                      of{" "}
                      <span className="text-foreground font-semibold">
                        {totalPages}
                      </span>
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!hasNextPage}
                      className="gap-1"
                      data-testid="button-next-page"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4" />
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