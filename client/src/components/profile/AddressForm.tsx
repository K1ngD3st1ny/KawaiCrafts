import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100),
  phoneNumber: z.string().regex(/^[+]?[\d\s\-()]{7,15}$/, "Invalid phone number"),
  addressLine1: z.string().min(5, "Address line 1 is required").max(200),
  addressLine2: z.string().max(200).optional(),
  landmark: z.string().max(100).optional(),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  country: z.string().min(2, "Country is required").max(100),
  postalCode: z.string().regex(/^\d{4,10}$/, "Invalid postal/PIN code"),
  addressType: z.enum(["home", "work", "other"]),
  isDefaultShipping: z.boolean(),
  isDefaultBilling: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddressFormValues) => Promise<void>;
  defaultValues?: Partial<AddressFormValues>;
  title?: string;
  isSubmitting?: boolean;
}

export default function AddressForm({
  open,
  onClose,
  onSubmit,
  defaultValues,
  title = "Add New Address",
  isSubmitting = false,
}: AddressFormDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      addressLine1: "",
      addressLine2: "",
      landmark: "",
      city: "",
      state: "",
      country: "India",
      postalCode: "",
      addressType: "home",
      isDefaultShipping: false,
      isDefaultBilling: false,
      ...defaultValues,
    },
  });

  const addressType = watch("addressType");
  const isDefaultShipping = watch("isDefaultShipping");
  const isDefaultBilling = watch("isDefaultBilling");

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = async (data: AddressFormValues) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Fill in the address details below. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          {/* Name + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="af-fullName">Full Name <span className="text-destructive">*</span></Label>
              <Input id="af-fullName" {...register("fullName")} placeholder="Recipient's full name" />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="af-phone">Phone Number <span className="text-destructive">*</span></Label>
              <Input id="af-phone" {...register("phoneNumber")} placeholder="+91 9876543210" />
              {errors.phoneNumber && <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>}
            </div>
          </div>

          {/* Address Lines */}
          <div className="space-y-1.5">
            <Label htmlFor="af-line1">Address Line 1 <span className="text-destructive">*</span></Label>
            <Input id="af-line1" {...register("addressLine1")} placeholder="House/Flat No., Building, Street" />
            {errors.addressLine1 && <p className="text-xs text-destructive">{errors.addressLine1.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="af-line2">Address Line 2 <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input id="af-line2" {...register("addressLine2")} placeholder="Area, Colony, locality" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="af-landmark">Landmark <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input id="af-landmark" {...register("landmark")} placeholder="Near school, next to temple…" />
          </div>

          {/* City, State, Country, Postal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="af-city">City <span className="text-destructive">*</span></Label>
              <Input id="af-city" {...register("city")} placeholder="Mumbai" />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="af-state">State <span className="text-destructive">*</span></Label>
              <Input id="af-state" {...register("state")} placeholder="Maharashtra" />
              {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="af-country">Country <span className="text-destructive">*</span></Label>
              <Input id="af-country" {...register("country")} placeholder="India" />
              {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="af-postal">PIN / Postal Code <span className="text-destructive">*</span></Label>
              <Input id="af-postal" {...register("postalCode")} placeholder="400001" maxLength={10} />
              {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode.message}</p>}
            </div>
          </div>

          {/* Address Type */}
          <div className="space-y-1.5">
            <Label>Address Type</Label>
            <Select
              value={addressType}
              onValueChange={(v) => setValue("addressType", v as "home" | "work" | "other", { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">🏠 Home</SelectItem>
                <SelectItem value="work">💼 Work</SelectItem>
                <SelectItem value="other">📍 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default Flags */}
          <div className="flex flex-col gap-3 pt-1">
            <div className="flex items-center gap-3">
              <Checkbox
                id="af-defaultShipping"
                checked={isDefaultShipping}
                onCheckedChange={(v) => setValue("isDefaultShipping", !!v, { shouldDirty: true })}
              />
              <Label htmlFor="af-defaultShipping" className="cursor-pointer font-normal">
                Set as default shipping address
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="af-defaultBilling"
                checked={isDefaultBilling}
                onCheckedChange={(v) => setValue("isDefaultBilling", !!v, { shouldDirty: true })}
              />
              <Label htmlFor="af-defaultBilling" className="cursor-pointer font-normal">
                Set as default billing address
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2 min-w-[120px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Address"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
