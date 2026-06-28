import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Download, ArrowLeft, Package } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface DownloadItem {
  id: string;
  productId: string;
  downloadCount: number;
  lastDownloadedAt: string | null;
  createdAt: string;
  productTitle: string;
  productThumbnail: string | null;
  productSeries: string;
}

export default function MyDownloadsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
      return;
    }

    if (isAuthenticated) {
      fetch("/api/download/user/list", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => setDownloads(data.downloads || []))
        .catch(() => toast({ title: "Error", description: "Failed to load downloads", variant: "destructive" }))
        .finally(() => setIsLoading(false));
    }
  }, [isAuthenticated, authLoading, setLocation, toast]);

  const handleDownload = async (productId: string) => {
    try {
      const res = await fetch(`/api/download/${productId}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Download Failed",
          description: data.error || "Unable to download",
          variant: "destructive",
        });
        return;
      }

      window.open(data.downloadUrl, "_blank");
    } catch {
      toast({
        title: "Download Error",
        description: "Failed to generate download link",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemCount={0} onCartClick={() => {}} />

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shop
        </Button>

        <h1 className="text-3xl font-heading font-bold mb-8">My Downloads</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : downloads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Downloads Yet</h3>
              <p className="text-muted-foreground mb-4">
                Your purchased papercraft PDFs will appear here.
              </p>
              <Button onClick={() => setLocation("/")}>Browse Products</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {downloads.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.productThumbnail ? (
                        <img
                          src={item.productThumbnail}
                          alt={item.productTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{item.productTitle}</h3>
                      <Badge variant="outline" className="text-xs mt-1">
                        {item.productSeries}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Downloaded {item.downloadCount} time{item.downloadCount !== 1 ? "s" : ""}
                        {item.lastDownloadedAt && (
                          <> · Last: {new Date(item.lastDownloadedAt).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>

                    <Button
                      onClick={() => handleDownload(item.productId)}
                      className="flex-shrink-0"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
