import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/currency";
import { ArrowLeft, Download, CheckCircle, ShoppingCart, Shield, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

// ── Razorpay type declaration ────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: any) => void) => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// ── Razorpay Key ID from Vite env ────────────────────────────────────
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID as string;

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const cart = useCart();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<{ id: string; title: string; price: number }[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<{ paymentId: string; orderId: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  // Pre-fill email from auth context
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  const handleRazorpayPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }

    if (cart.subtotal <= 0) {
      toast({ title: "Cart is empty", description: "Add items to your cart before checking out.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create order on backend
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: cart.subtotal }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const { orderId, amount, currency } = await orderRes.json();

      // Step 2: Open Razorpay checkout modal
      const options: RazorpayOptions = {
        key: RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "KawaiCraft",
        description: `${cart.totalItems} papercraft PDF${cart.totalItems > 1 ? "s" : ""}`,
        order_id: orderId,
        prefill: {
          name: user?.name || "",
          email: email,
        },
        theme: {
          color: "#7c3aed", // Purple to match the brand
        },
        handler: async (response: RazorpayResponse) => {
          // Step 3: Verify payment on backend
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                items: cart.cartItems,
                totalAmount: cart.subtotal,
              }),
            });

            if (!verifyRes.ok) {
              const errorData = await verifyRes.json();
              throw new Error(errorData.error || "Payment verification failed");
            }

            const verifyData = await verifyRes.json();

            if (verifyData.verified) {
              // Payment verified — show success
              setPurchasedItems(
                cart.cartItems.map((item) => ({
                  id: item.id,
                  title: item.title,
                  price: item.price * item.quantity,
                }))
              );
              setPaymentDetails({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
              });
              setIsComplete(true);
              cart.clearCart();
              toast({ title: "Payment successful! 🎉", description: "Your papercraft PDFs are ready for download." });
            } else {
              throw new Error("Payment could not be verified");
            }
          } catch (verifyErr: any) {
            console.error("Verification error:", verifyErr);
            toast({
              title: "Verification failed",
              description: verifyErr.message || "Payment was received but could not be verified. Please contact support.",
              variant: "destructive",
            });
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            // User closed the Razorpay modal without completing payment
            setIsProcessing(false);
            toast({
              title: "Payment cancelled",
              description: "You can try again whenever you're ready.",
            });
          },
        },
      };

      const rzp = new window.Razorpay(options);

      // Handle payment failures
      rzp.on("payment.failed", (response: any) => {
        setIsProcessing(false);
        console.error("Payment failed:", response.error);
        toast({
          title: "Payment failed",
          description: response.error?.description || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      });

      rzp.open();
    } catch (err: any) {
      console.error("Checkout error:", err);
      setIsProcessing(false);
      toast({
        title: "Checkout error",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  // ── Success screen ─────────────────────────────────────────────────
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
              <p className="text-muted-foreground mb-2">
                Download links have been sent to: <strong>{email}</strong>
              </p>
              {paymentDetails && (
                <p className="text-xs text-muted-foreground">
                  Payment ID: {paymentDetails.paymentId}
                </p>
              )}
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

  // ── Empty cart ──────────────────────────────────────────────────────
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

  // ── Checkout form ──────────────────────────────────────────────────
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
              <form onSubmit={handleRazorpayPayment} className="space-y-6">
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

                {/* Razorpay Payment Section */}
                <div className="space-y-4">
                  <Label>Payment Method</Label>
                  <div className="p-5 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Razorpay Secure Checkout</p>
                        <p className="text-xs text-muted-foreground">UPI, Cards, Wallets, Net Banking</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Shield className="w-3.5 h-3.5 text-green-600" />
                      <span>256-bit encrypted &bull; PCI DSS compliant</span>
                    </div>
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
                      Opening Razorpay...
                    </>
                  ) : (
                    <>
                      Pay {formatPrice(cart.subtotal)} with Razorpay
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

  // ── Download helper ────────────────────────────────────────────────
  async function handleDownload(itemId: string) {
    try {
      const response = await fetch(`/api/download/${itemId}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Download failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
        return;
      }

      window.open(data.downloadUrl, "_blank");
    } catch (err) {
      console.error("Download error:", err);
      toast({
        title: "Download failed",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    }
  }
}