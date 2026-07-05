import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Settings, Lock, Chrome, Mail, Calendar, Clock,
  Eye, EyeOff, Loader2, Save, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "At least 6 characters").max(100),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

interface ProfileUser {
  authProvider: "email" | "google";
  createdAt: string;
  updatedAt: string;
}

interface AccountSettingsCardProps {
  user: ProfileUser;
}

export default function AccountSettingsCard({ user }: AccountSettingsCardProps) {
  const { toast } = useToast();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isGoogleOnly = user.authProvider === "google";

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: ChangePasswordValues) => {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to change password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password changed!", description: "Your password has been updated." });
      reset();
    },
    onError: (err: Error) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

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
        <CardDescription>Manage your security and account preferences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Auth Provider */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Sign-in Method
          </h3>
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            {isGoogleOnly ? (
              <>
                <Chrome className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Google</p>
                  <p className="text-xs text-muted-foreground">You sign in using your Google account</p>
                </div>
                <Badge variant="secondary" className="ml-auto">Active</Badge>
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Email & Password</p>
                  <p className="text-xs text-muted-foreground">You sign in using email and password</p>
                </div>
                <Badge variant="secondary" className="ml-auto">Active</Badge>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Change Password */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Change Password
          </h3>

          {isGoogleOnly ? (
            <div className="p-4 rounded-lg border border-dashed text-center space-y-1">
              <Chrome className="w-8 h-8 mx-auto text-blue-400 opacity-60" />
              <p className="text-sm font-medium text-muted-foreground">Password Change Unavailable</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Your account uses Google Sign-In. Password management is handled by Google.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit((d) => passwordMutation.mutate(d))}
              className="space-y-4"
            >
              {/* Current Password */}
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    {...register("currentPassword")}
                    placeholder="Enter current password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    {...register("newPassword")}
                    placeholder="At least 6 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-destructive">{errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    {...register("confirmPassword")}
                    placeholder="Repeat new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!isDirty || isSubmitting || passwordMutation.isPending}
                  className="gap-2 min-w-[160px]"
                >
                  {passwordMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
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
