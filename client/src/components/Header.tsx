import { useState } from "react";
import { Search, ShoppingCart, User, Menu, Scissors, Download, Package, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  onSearchSubmit?: (query: string) => void;
}

export default function Header({ cartItemCount = 0, onCartClick, onSearchSubmit }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
    console.log("Search triggered:", searchQuery);
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
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

            {/* Auth - Logged In */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2"
                    data-testid="button-user-menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden lg:inline">
                      {user.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setLocation("/my-downloads")}
                    data-testid="menu-my-downloads"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    My Downloads
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLocation("/my-orders")}
                    data-testid="menu-my-orders"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    My Orders
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setLocation("/admin/dashboard")}
                        data-testid="menu-admin-dashboard"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                    data-testid="menu-logout"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Auth - Logged Out */
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/login")}
                  data-testid="button-login"
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => setLocation("/register")}
                  data-testid="button-register"
                >
                  Register
                </Button>
              </div>
            )}
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

              {isAuthenticated && user ? (
                <>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => { setLocation("/my-downloads"); setIsMobileMenuOpen(false); }}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    My Downloads
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => { setLocation("/my-orders"); setIsMobileMenuOpen(false); }}
                  >
                    <Package className="h-5 w-5 mr-2" />
                    My Orders
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => { setLocation("/admin/dashboard"); setIsMobileMenuOpen(false); }}
                    >
                      <Shield className="h-5 w-5 mr-2" />
                      Admin Dashboard
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="justify-start text-destructive hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => { setLocation("/login"); setIsMobileMenuOpen(false); }}
                    data-testid="button-login-mobile"
                  >
                    <User className="h-5 w-5 mr-2" />
                    Login
                  </Button>
                  <Button
                    variant="default"
                    className="justify-start"
                    onClick={() => { setLocation("/register"); setIsMobileMenuOpen(false); }}
                  >
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}