import { useState } from "react";
import { Search, ShoppingCart, User, Menu, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  onSearchSubmit?: (query: string) => void;
}

export default function Header({ cartItemCount = 0, onCartClick, onSearchSubmit }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
    console.log("Search triggered:", searchQuery);
  };

  const animeSeriesList = [
    "Demon Slayer", "One Piece", "Jujutsu Kaisen", "Naruto", 
    "Attack on Titan", "Dragon Ball", "My Hero Academia", "Chainsaw Man"
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Scissors className="h-8 w-8 text-primary rotate-45" />
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Kawai Craft
            </h1>
          </div>

          {/* Desktop Search */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for Naruto, Chainsaw Man..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full"
                data-testid="input-search"
              />
            </div>
          </form>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Filter by Series */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="button-series-filter">
                  Filter by Series
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                {animeSeriesList.map((series) => (
                  <DropdownMenuItem key={series} data-testid={`menu-series-${series.toLowerCase().replace(/\s+/g, "-")}`}>
                    {series}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={onCartClick}
              data-testid="button-cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary"
                  data-testid="badge-cart-count"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-user-menu">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem data-testid="menu-login">Login</DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-register">Register</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <form onSubmit={handleSearchSubmit} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for Naruto, Chainsaw Man..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full"
                  data-testid="input-search-mobile"
                />
              </div>
            </form>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start" data-testid="button-series-filter-mobile">
                Filter by Series
              </Button>
              <Button
                variant="ghost"
                className="justify-start relative"
                onClick={onCartClick}
                data-testid="button-cart-mobile"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart ({cartItemCount})
              </Button>
              <Button variant="ghost" className="justify-start" data-testid="button-login-mobile">
                <User className="h-5 w-5 mr-2" />
                Login / Register
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}