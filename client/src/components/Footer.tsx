import { Scissors } from "lucide-react";
import { SiRazorpay, SiVisa, SiMastercard, SiGooglepay, SiApplepay } from "react-icons/si";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const paymentBadges = [
    { icon: SiRazorpay, label: "Razorpay" },
    { icon: SiVisa, label: "Visa" },
    { icon: SiMastercard, label: "Mastercard" },
    { icon: SiGooglepay, label: "Google Pay" },
    { icon: SiApplepay, label: "Apple Pay" },
  ];

  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Scissors className="h-6 w-6 text-primary rotate-45" />
              <h3 className="text-xl font-heading font-bold">KawaiCrafts</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Your premier destination for anime papercraft PDFs. Bringing your favorite characters to life, one fold at a time.
            </p>
            <p className="text-muted-foreground font-medium text-sm">
              Handcrafted anime-inspired goods made with love.
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground pt-2">
              <span>Made with</span>
              <span className="text-red-500 mx-1">❤</span>
              <span>for anime fans worldwide</span>
            </div>
          </div>

          {/* Payment & Trust Indicators Column */}
          <div className="space-y-4 md:text-right flex flex-col md:items-end justify-center">
            <h4 className="text-lg font-heading font-semibold">Secure Checkout</h4>
            <p className="text-muted-foreground text-sm max-w-sm">
              Shop with confidence. We offer 100% secure payments through Razorpay and support all major payment methods including UPI.
            </p>
            <div className="flex gap-3 mt-4 flex-wrap justify-start md:justify-end">
              {paymentBadges.map((badge) => {
                const IconComponent = badge.icon;
                return (
                  <div
                    key={badge.label}
                    className="bg-muted p-2.5 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border shadow-sm"
                    title={badge.label}
                  >
                    <IconComponent className="h-6 w-6" />
                    <span className="sr-only">{badge.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground" data-testid="text-copyright">
            © {currentYear} KawaiCrafts. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}