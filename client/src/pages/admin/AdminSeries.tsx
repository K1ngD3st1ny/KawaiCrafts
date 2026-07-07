import { useEffect, useState, useRef } from "react";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2, Image, X, Layers } from "lucide-react";

interface SeriesItem {
  id: string;
  name: string;
  imageUrl: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSeries() {
  const { toast } = useToast();
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SeriesItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SeriesItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formOrder, setFormOrder] = useState("0");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const fetchSeries = () => {
    setIsLoading(true);
    fetch("/api/series")
      .then((res) => res.json())
      .then((data) => setSeriesList(data.series || []))
      .catch(() =>
        toast({
          title: "Error",
          description: "Failed to load series",
          variant: "destructive",
        })
      )
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  const openCreateDialog = () => {
    setEditTarget(null);
    setFormName("");
    setFormOrder("0");
    setImageFile(null);
    setImagePreview(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (series: SeriesItem) => {
    setEditTarget(series);
    setFormName(series.name);
    setFormOrder(String(series.displayOrder));
    setImageFile(null);
    setImagePreview(series.imageUrl);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      toast({
        title: "Validation Error",
        description: "Series name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", formName.trim());
      formData.append("displayOrder", formOrder);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const isEdit = !!editTarget;
      const url = isEdit
        ? `/api/admin/series/${editTarget.id}`
        : "/api/admin/series";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save series");
      }

      toast({
        title: isEdit ? "Series Updated" : "Series Created",
        description: `"${formName}" has been ${isEdit ? "updated" : "added"} successfully.`,
      });

      setIsDialogOpen(false);
      fetchSeries();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save series",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/series/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Delete failed");

      toast({
        title: "Deleted",
        description: `"${deleteTarget.name}" has been removed.`,
      });
      setSeriesList((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete series",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <AdminLayout activeTab="series">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Anime Series</h1>
            <p className="text-muted-foreground mt-1">
              Manage featured series images for the storefront
            </p>
          </div>
          <Button onClick={openCreateDialog} data-testid="button-add-series">
            <Plus className="w-4 h-4 mr-2" />
            Add Series
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <Skeleton className="w-24 h-24 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : seriesList.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Layers className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Series Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add anime series to show on your storefront's featured section.
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Series
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {seriesList.map((series) => (
              <Card
                key={series.id}
                className="group relative overflow-hidden hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-4 flex flex-col items-center gap-3">
                  {/* Circular Image */}
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-border group-hover:ring-primary/50 transition-all">
                    {series.imageUrl ? (
                      <img
                        src={series.imageUrl}
                        alt={series.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500">
                        <span className="text-2xl font-bold text-white">
                          {series.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Name & Order */}
                  <div className="text-center">
                    <p className="font-medium text-sm">{series.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Order: {series.displayOrder}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditDialog(series)}
                      data-testid={`button-edit-series-${series.id}`}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(series)}
                      data-testid={`button-delete-series-${series.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Series" : "Add New Series"}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Update the series name, order, or image."
                : "Add a new anime series with a cover image."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-28 h-28 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary transition-colors flex items-center justify-center bg-muted/30 relative"
                onClick={() => {
                  // Reset file input value so selecting the same file again triggers onChange
                  if (imageInputRef.current) {
                    imageInputRef.current.value = "";
                  }
                  imageInputRef.current?.click();
                }}
              >
                {imagePreview ? (
                  <div className="relative w-full h-full group/img">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {/* Hover overlay to indicate clickable */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Click to change</span>
                    </div>
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-2">
                    <Image className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Upload</p>
                  </div>
                )}
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP — max 5MB
              </p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="series-name">
                Series Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="series-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Demon Slayer"
                required
              />
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="series-order">Display Order</Label>
              <Input
                id="series-order"
                type="number"
                min="0"
                value={formOrder}
                onChange={(e) => setFormOrder(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first in the featured section.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {editTarget ? "Updating..." : "Creating..."}
                  </>
                ) : editTarget ? (
                  "Update Series"
                ) : (
                  "Create Series"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Series?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}" and its
              image. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
