import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin, Plus, Pencil, Trash2, Home, Briefcase, Navigation,
  Truck, CreditCard, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import AddressForm, { type AddressFormValues } from "./AddressForm";

interface Address {
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
}

interface AddressBookProps {
  addresses: Address[];
}

const typeIcon = {
  home: <Home className="w-4 h-4" />,
  work: <Briefcase className="w-4 h-4" />,
  other: <Navigation className="w-4 h-4" />,
};

const typeLabel = { home: "Home", work: "Work", other: "Other" };

export default function AddressBook({ addresses }: AddressBookProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

  // ─── Add ────────────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: async (data: AddressFormValues) => {
      const res = await fetch("/api/profile/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to add");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Address added!" });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setAddOpen(false);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // ─── Edit ───────────────────────────────────────────────────────────────────
  const editMutation = useMutation({
    mutationFn: async (data: AddressFormValues) => {
      if (!editAddress) return;
      const res = await fetch(`/api/profile/addresses/${editAddress.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Address updated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setEditAddress(null);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/profile/addresses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete");
    },
    onSuccess: () => {
      toast({ title: "Address deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setDeleteId(null);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // ─── Set Default ─────────────────────────────────────────────────────────────
  const setDefaultMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: "shipping" | "billing" }) => {
      const res = await fetch(`/api/profile/addresses/${id}/default`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
    },
    onSuccess: () => {
      toast({ title: "Default address updated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setSettingDefault(null);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Address Book
            </CardTitle>
            <CardDescription className="mt-1">
              Manage your saved shipping and billing addresses.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Address
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No addresses saved yet</p>
            <p className="text-sm mt-1">Add your first shipping address to get started.</p>
            <Button className="mt-4 gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Address
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="border rounded-xl p-4 space-y-3 hover:border-primary/40 transition-colors relative group"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{typeIcon[addr.addressType]}</span>
                    <span className="font-semibold text-sm">{typeLabel[addr.addressType]}</span>
                    <div className="flex gap-1">
                      {addr.isDefaultShipping && (
                        <Badge variant="secondary" className="text-xs gap-1 px-1.5">
                          <Truck className="w-3 h-3" /> Shipping
                        </Badge>
                      )}
                      {addr.isDefaultBilling && (
                        <Badge variant="secondary" className="text-xs gap-1 px-1.5">
                          <CreditCard className="w-3 h-3" /> Billing
                        </Badge>
                      )}
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditAddress(addr)}
                      title="Edit address"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(addr.id)}
                      title="Delete address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Address Details */}
                <div className="text-sm text-muted-foreground space-y-0.5">
                  <p className="font-medium text-foreground">{addr.fullName}</p>
                  <p>{addr.phoneNumber}</p>
                  <p>{addr.addressLine1}</p>
                  {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                  {addr.landmark && <p>Near: {addr.landmark}</p>}
                  <p>
                    {addr.city}, {addr.state} — {addr.postalCode}
                  </p>
                  <p>{addr.country}</p>
                </div>

                {/* Default Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {!addr.isDefaultShipping && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 gap-1"
                      disabled={setDefaultMutation.isPending && settingDefault === addr.id + "shipping"}
                      onClick={() => {
                        setSettingDefault(addr.id + "shipping");
                        setDefaultMutation.mutate({ id: addr.id, type: "shipping" });
                      }}
                    >
                      {setDefaultMutation.isPending && settingDefault === addr.id + "shipping" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Truck className="w-3 h-3" />
                      )}
                      Set Shipping Default
                    </Button>
                  )}
                  {!addr.isDefaultBilling && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 gap-1"
                      disabled={setDefaultMutation.isPending && settingDefault === addr.id + "billing"}
                      onClick={() => {
                        setSettingDefault(addr.id + "billing");
                        setDefaultMutation.mutate({ id: addr.id, type: "billing" });
                      }}
                    >
                      {setDefaultMutation.isPending && settingDefault === addr.id + "billing" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CreditCard className="w-3 h-3" />
                      )}
                      Set Billing Default
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Dialog */}
      <AddressForm
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (data) => addMutation.mutateAsync(data)}
        isSubmitting={addMutation.isPending}
        title="Add New Address"
      />

      {/* Edit Dialog */}
      <AddressForm
        open={!!editAddress}
        onClose={() => setEditAddress(null)}
        onSubmit={async (data) => editMutation.mutateAsync(data)}
        defaultValues={editAddress ? { ...editAddress, addressLine2: editAddress.addressLine2 ?? undefined, landmark: editAddress.landmark ?? undefined } : undefined}
        isSubmitting={editMutation.isPending}
        title="Edit Address"
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this address?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The address will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
