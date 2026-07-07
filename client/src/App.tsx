import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import HomePage from "@/pages/HomePage";
import CheckoutPage from "@/pages/CheckoutPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ProfilePage from "@/pages/ProfilePage";
import MyDownloadsPage from "@/pages/MyDownloadsPage";
import MyOrdersPage from "@/pages/MyOrdersPage";
import WishlistPage from "@/pages/WishlistPage";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminProductForm from "@/pages/admin/AdminProductForm";
import AdminSeries from "@/pages/admin/AdminSeries";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />

      {/* Protected customer routes */}
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/my-downloads" component={MyDownloadsPage} />
      <Route path="/my-orders" component={MyOrdersPage} />
      <Route path="/wishlist" component={WishlistPage} />


      {/* Admin routes */}
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/series" component={AdminSeries} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/products/new" component={AdminProductForm} />
      <Route path="/admin/products/edit/:id" component={AdminProductForm} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
