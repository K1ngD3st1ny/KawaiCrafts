import { Scissors } from "lucide-react";
import { SiInstagram, SiX, SiTiktok, SiPinterest } from "react-icons/si";
import { Button } from "@/components/ui/button";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: SiInstagram, label: "Instagram", href: "#", color: "hover:text-pink-500" },
    { icon: SiX, label: "X", href: "#", color: "hover:text-blue-400" },
    { icon: SiTiktok, label: "TikTok", href: "#", color: "hover:text-red-500" },
    { icon: SiPinterest, label: "Pinterest", href: "#", color: "hover:text-red-600" },
  ];

  const quickLinks = [
    { label: "Home", href: "#" },
    { label: "All Catalogues", href: "#" },
    { label: "FAQ", href: "#" },
    { label: "Contact Us", href: "#" },
  ];

  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Scissors className="h-6 w-6 text-primary rotate-45" />
              <h3 className="text-xl font-heading font-bold">Kawai Craft</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Your premier destination for anime papercraft PDFs. Bringing your favorite characters to life, one fold at a time.
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Made with</span>
              <span className="text-red-500 mx-1">❤</span>
              <span>for anime fans worldwide</span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4">
            <h4 className="text-lg font-heading font-semibold">Quick Links</h4>
            <nav className="space-y-2">
              {quickLinks.map((link) => (
                <Button
                  key={link.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                  data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {link.label}
                </Button>
              ))}
            </nav>
          </div>

          {/* Social Media Column */}
          <div className="space-y-4">
            <h4 className="text-lg font-heading font-semibold">Follow Us</h4>
            <p className="text-muted-foreground text-sm">
              Stay updated with the latest anime papercraft releases and crafting tips!
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <Button
                    key={social.label}
                    variant="ghost"
                    size="icon"
                    className={`text-muted-foreground transition-colors duration-200 ${social.color}`}
                    data-testid={`button-social-${social.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="sr-only">{social.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground" data-testid="text-copyright">
            © {currentYear} Kawai Craft. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}