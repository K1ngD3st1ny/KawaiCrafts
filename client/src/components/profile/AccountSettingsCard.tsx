import {
  Settings, Chrome, Calendar, Clock, ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileUser {
  authProvider: "email" | "google";
  createdAt: string;
  updatedAt: string;
}

interface AccountSettingsCardProps {
  user: ProfileUser;
}

export default function AccountSettingsCard({ user }: AccountSettingsCardProps) {
  const fmt = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Account Settings
        </CardTitle>
        <CardDescription>Your account security and preferences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Auth Provider */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Sign-in Method
          </h3>
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <Chrome className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Google</p>
              <p className="text-xs text-muted-foreground">You sign in using your Google account</p>
            </div>
            <Badge variant="secondary" className="ml-auto">Active</Badge>
          </div>
        </div>

        <Separator />

        {/* Account Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Account Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm font-medium">{fmt(user.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">{fmt(user.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
