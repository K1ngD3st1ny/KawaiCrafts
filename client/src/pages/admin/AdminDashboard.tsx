import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Users, ShoppingCart, IndianRupee } from "lucide-react";
import { formatPrice } from "@/lib/currency";

interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  revenue: number;
}

interface RecentProduct {
  id: string;
  title: string;
  animeSeries: string;
  price: string;
  active: boolean;
  featured: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setRecentProducts(data.recentProducts || []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const statCards = [
    {
      title: "Total Products",
      value: stats?.totalProducts ?? 0,
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Customers",
      value: stats?.totalCustomers ?? 0,
      icon: Users,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders ?? 0,
      icon: ShoppingCart,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Revenue",
      value: formatPrice(stats?.revenue ?? 0),
      icon: IndianRupee,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <AdminLayout activeTab="dashboard">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your store performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading
            ? [...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))
            : statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.title}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <div
                          className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}
                        >
                          <Icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                      </div>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        {/* Recent Products */}
        <Card>
          <CardHeader>
            <CardTitle>Recently Added Products</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No products yet. Add your first product!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 text-sm font-medium text-muted-foreground">
                        Title
                      </th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">
                        Series
                      </th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">
                        Price
                      </th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">
                        Added
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProducts.map((product) => (
                      <tr key={product.id} className="border-b last:border-0">
                        <td className="py-3 text-sm font-medium">
                          {product.title}
                          {product.featured && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Featured
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {product.animeSeries}
                        </td>
                        <td className="py-3 text-sm font-medium">
                          {formatPrice(parseFloat(product.price))}
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={product.active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {product.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
