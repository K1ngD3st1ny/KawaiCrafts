import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Phone, MapPin, Settings } from "lucide-react";
import PersonalInfoCard from "@/components/profile/PersonalInfoCard";
import ContactInfoCard from "@/components/profile/ContactInfoCard";
import AddressBook from "@/components/profile/AddressBook";
import AccountSettingsCard from "@/components/profile/AccountSettingsCard";

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const { data, isLoading, error } = useQuery<{
    user: {
      id: string;
      name: string;
      email: string;
      firstName?: string | null;
      middleName?: string | null;
      lastName?: string | null;
      displayName?: string | null;
      dateOfBirth?: string | null;
      gender?: string | null;
      phoneNumber?: string | null;
      alternatePhoneNumber?: string | null;
      profileImageUrl?: string | null;
      authProvider: "email" | "google";
      createdAt: string;
      updatedAt: string;
    };
    addresses: Array<{
      id: string;
      fullName: string;
      phoneNumber: string;
      addressLine1: string;
      addressLine2?: string | null;
      landmark?: string | null;
      city: string;
      state: string;
      country: string;
      postalCode: string;
      addressType: "home" | "work" | "other";
      isDefaultShipping: boolean;
      isDefaultBilling: boolean;
    }>;
  }>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold font-heading">My Profile</h1>
            <p className="text-sm text-muted-foreground">Manage your account information</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {isLoading ? (
          <ProfileSkeleton />
        ) : error ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-destructive font-medium">Failed to load profile</p>
            <p className="text-sm mt-1">Please try refreshing the page.</p>
          </div>
        ) : data ? (
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1">
              <TabsTrigger value="personal" className="flex items-center gap-1.5 py-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Personal</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-1.5 py-2">
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Contact</span>
              </TabsTrigger>
              <TabsTrigger value="addresses" className="flex items-center gap-1.5 py-2">
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Addresses</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1.5 py-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-0">
              <PersonalInfoCard user={data.user} />
            </TabsContent>

            <TabsContent value="contact" className="mt-0">
              <ContactInfoCard user={data.user} />
            </TabsContent>

            <TabsContent value="addresses" className="mt-0">
              <AddressBook addresses={data.addresses} />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <AccountSettingsCard user={data.user} />
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-10 rounded-md" />
          <Skeleton className="h-10 rounded-md" />
          <Skeleton className="h-10 rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 rounded-md" />
          <Skeleton className="h-10 rounded-md" />
        </div>
      </div>
    </div>
  );
}
