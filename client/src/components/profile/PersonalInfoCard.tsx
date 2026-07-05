import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  middleName: z.string().max(50).optional(),
  lastName: z.string().min(1, "Last name is required").max(50),
  displayName: z.string().max(50).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "non_binary", "prefer_not_to_say", "none"]).optional(),
  name: z.string().min(2).max(100).optional(),
});

type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

interface ProfileUser {
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
}

interface PersonalInfoCardProps {
  user: ProfileUser;
}

export default function PersonalInfoCard({ user }: PersonalInfoCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: user.firstName || "",
      middleName: user.middleName || "",
      lastName: user.lastName || "",
      displayName: user.displayName || "",
      dateOfBirth: user.dateOfBirth || "",
      // Use "none" sentinel if gender is null/empty so Select renders the placeholder
      gender: (user.gender as PersonalInfoValues["gender"]) || "none",
      name: user.name || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PersonalInfoValues) => {
      const payload: Record<string, string | null | undefined> = {
        firstName: data.firstName || undefined,
        middleName: data.middleName || null,
        lastName: data.lastName || undefined,
        displayName: data.displayName || null,
        dateOfBirth: data.dateOfBirth || null,
        // Convert "none" sentinel back to null for the API
        gender: (data.gender && data.gender !== "none") ? data.gender : null,
        name: data.name || undefined,
      };

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Profile updated!", description: "Your information has been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      reset({
        firstName: data.user.firstName || "",
        middleName: data.user.middleName || "",
        lastName: data.user.lastName || "",
        displayName: data.user.displayName || "",
        dateOfBirth: data.user.dateOfBirth || "",
        gender: data.user.gender || "none",
        name: data.user.name || "",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const handleAvatarChange = useCallback(
    async (file: File) => {
      // Preview
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      setUploadingAvatar(true);
      try {
        const formData = new FormData();
        formData.append("avatar", file);
        const res = await fetch("/api/profile/avatar", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Upload failed");
        }
        queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        toast({ title: "Profile picture updated!" });
      } catch (err: any) {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        setAvatarPreview(null);
      } finally {
        setUploadingAvatar(false);
      }
    },
    [queryClient, toast]
  );

  const currentGender = watch("gender");
  const displaySrc = avatarPreview || user.profileImageUrl || undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Personal Information
        </CardTitle>
        <CardDescription>Update your name, profile picture, and personal details.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Avatar Upload */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative group">
            <Avatar className="h-24 w-24 ring-2 ring-primary/20">
              <AvatarImage src={displaySrc} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Change profile picture"
            >
              {uploadingAvatar ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Change Photo
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP · Max 5 MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAvatarChange(file);
              e.target.value = "";
            }}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
              <Input id="firstName" {...register("firstName")} placeholder="First name" />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input id="middleName" {...register("middleName")} placeholder="Middle name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
              <Input id="lastName" {...register("lastName")} placeholder="Last name" />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input id="displayName" {...register("displayName")} placeholder="How you appear publicly" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name (for display)</Label>
              <Input id="name" {...register("name")} placeholder="Full display name" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} max={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-2">
              <Label>Gender <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Select
                value={currentGender || "none"}
                onValueChange={(v) => setValue("gender", v as PersonalInfoValues["gender"], { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled className="text-muted-foreground">Select gender</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non_binary">Non-binary</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
