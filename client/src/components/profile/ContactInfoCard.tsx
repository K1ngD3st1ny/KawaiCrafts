import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Loader2, Save, CheckCircle, AlertCircle, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^[+]?[\d\s\-()]{7,15}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  alternatePhoneNumber: z
    .string()
    .regex(/^[+]?[\d\s\-()]{7,15}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
});

type ContactValues = z.infer<typeof contactSchema>;

interface ProfileUser {
  email: string;
  phoneNumber?: string | null;
  alternatePhoneNumber?: string | null;
  authProvider: "email" | "google";
}

interface ContactInfoCardProps {
  user: ProfileUser;
}

export default function ContactInfoCard({ user }: ContactInfoCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      phoneNumber: user.phoneNumber || "",
      alternatePhoneNumber: user.alternatePhoneNumber || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ContactValues) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phoneNumber: data.phoneNumber || null,
          alternatePhoneNumber: data.alternatePhoneNumber || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Contact info updated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      reset({
        phoneNumber: data.user.phoneNumber || "",
        alternatePhoneNumber: data.user.alternatePhoneNumber || "",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary" />
          Contact Information
        </CardTitle>
        <CardDescription>Manage your email address and phone numbers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address
          </Label>
          <div className="flex items-center gap-3">
            <Input value={user.email} readOnly className="bg-muted/50 cursor-not-allowed" />
            <Badge variant="secondary" className="shrink-0 gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Verified
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Email address cannot be changed here. Contact support if needed.
          </p>
        </div>

        {/* Auth Provider */}
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
          {user.authProvider === "google" ? (
            <>
              <Chrome className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Signed in with Google</p>
                <p className="text-xs text-muted-foreground">Your account is linked to Google OAuth</p>
              </div>
            </>
          ) : (
            <>
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Email & Password</p>
                <p className="text-xs text-muted-foreground">You sign in with your email and password</p>
              </div>
            </>
          )}
        </div>

        {/* Phone Numbers */}
        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Mobile Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phoneNumber"
                {...register("phoneNumber")}
                placeholder="+91 9876543210"
                className="pl-9"
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="alternatePhoneNumber">
              Alternate Mobile <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="alternatePhoneNumber"
                {...register("alternatePhoneNumber")}
                placeholder="+91 9876543211"
                className="pl-9"
              />
            </div>
            {errors.alternatePhoneNumber && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.alternatePhoneNumber.message}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={!isDirty || isSubmitting} className="gap-2 min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
