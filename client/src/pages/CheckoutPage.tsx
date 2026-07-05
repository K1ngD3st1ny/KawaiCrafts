import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/currency";
import { ArrowLeft, Download, CheckCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const cart = useCart();
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  // Snapshot of purchased items for the confirmation screen
  const [purchasedItems, setPurchasedItems] = useState<{ id: string; title: string; price: number }[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Snapshot items before clearing cart
    setPurchasedItems(cart.cartItems.map((item) => ({
      id: item.id,
      title: item.title,
      price: item.price * item.quantity,
    })));

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
      cart.clearCart();
      console.log("Payment completed successfully");
    }, 2000);
  };

  const handleDownload = async (itemId: string) => {
    try {
      const response = await fetch(`/api/download/${itemId}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        alert(`Download failed: ${data.error || "Unknown error"}`);
        return;
      }

      // Open the signed URL to trigger download
      window.open(data.downloadUrl, "_blank");
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download file. Please try again.");
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-heading">Thank You for Your Order!</CardTitle>
            <CardDescription>Your papercraft PDFs are ready for download</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Download links have been sent to: <strong>{email}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Instant Downloads:</h3>
              {purchasedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="font-medium">{item.title}</span>
                  <Button
                    onClick={() => handleDownload(item.id)}
                    className="bg-primary"
                    data-testid={`button-download-${item.id}`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="w-full"
                data-testid="button-continue-shopping"
              >
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty cart state
  if (cart.cartItems.length === 0 && !isComplete) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>

          <div className="text-center py-24 px-4 bg-muted/30 rounded-2xl border border-dashed">
            <div className="bg-background w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ShoppingCart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Add some amazing papercraft to your cart before checking out!
            </p>
            <Button size="lg" onClick={() => setLocation("/")}>
              Browse Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4"
            data-testid="button-back-to-shop"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>
          <h1 className="text-3xl font-heading font-bold">Secure Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your anime papercraft collection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cart.cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <div>
                      <span className="font-medium">{item.title}</span>
                      {item.quantity > 1 && (
                        <span className="text-sm text-muted-foreground ml-2">×{item.quantity}</span>
                      )}
                    </div>
                    <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary" data-testid="text-checkout-total">
                      {formatPrice(cart.subtotal)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>Enter your details for instant download access</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-checkout-email"
                  />
                  <p className="text-sm text-muted-foreground">
                    Download links will be sent to this email
                  </p>
                </div>

                {/* Stripe Payment Section Placeholder */}
                <div className="space-y-4">
                  <Label>Payment Method</Label>
                  <div className="p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                    <p className="text-muted-foreground mb-2">
                      🔒 Secure Payment Processing
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Stripe integration will be implemented here
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isProcessing || !email}
                  data-testid="button-complete-purchase"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      Complete Purchase - {formatPrice(cart.subtotal)}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By completing your purchase, you agree to our Terms of Service and Privacy Policy. 
                  All sales are final. Digital downloads only.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}