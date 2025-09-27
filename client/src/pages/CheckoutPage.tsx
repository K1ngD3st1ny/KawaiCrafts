import { useState } from "react";
import { ArrowLeft, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  //todo: remove mock functionality
  const mockCartItems = [
    { id: "gojo-infinity", title: "Gojo Satoru - Infinity Form", price: 4.99 },
    { id: "nezuko-chibi", title: "Nezuko - Chibi Form", price: 3.99 },
  ];

  const subtotal = mockCartItems.reduce((sum, item) => sum + item.price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
      console.log("Payment completed successfully");
    }, 2000);
  };

  const handleDownload = (itemId: string) => {
    console.log(`Downloading ${itemId}`);
    // Simulate download
    alert(`Downloading ${itemId} PDF...`);
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
              {mockCartItems.map((item) => (
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
                {mockCartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <span className="font-medium">{item.title}</span>
                    <span className="font-semibold">${item.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary" data-testid="text-checkout-total">
                      ${subtotal.toFixed(2)}
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
                      Complete Purchase - ${subtotal.toFixed(2)}
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