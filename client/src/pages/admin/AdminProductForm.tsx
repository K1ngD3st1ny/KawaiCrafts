import { useEffect, useState, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Image, FileText, X, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface GalleryImage {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

export default function AdminProductForm() {
  const [, params] = useRoute("/admin/products/edit/:id");
  const isEdit = !!params?.id;
  const productId = params?.id;

  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(isEdit);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state
  const [title, setTitle] = useState("");
  const [animeSeries, setAnimeSeries] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [pageCount, setPageCount] = useState("1");
  const [price, setPrice] = useState("");
  const [popularity, setPopularity] = useState("0");
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);

  // File state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [existingPdfName, setExistingPdfName] = useState<string | null>(null);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  // Load existing product in edit mode
  useEffect(() => {
    if (isEdit && productId) {
      fetch(`/api/admin/products`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          const product = data.products?.find(
            (p: any) => p.id === productId
          );
          if (product) {
            setTitle(product.title);
            setAnimeSeries(product.animeSeries);
            setCharacterName(product.characterName);
            setDescription(product.description || "");
            setDifficulty(product.difficulty);
            setPageCount(String(product.pageCount));
            setPrice(product.price);
            setPopularity(String(product.popularity));
            setFeatured(product.featured);
            setActive(product.active);
            if (product.thumbnailUrl) setThumbnailPreview(product.thumbnailUrl);
            if (product.pdfUrl) setExistingPdfName(product.pdfUrl);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingProduct(false));
        
      // Fetch gallery images
      fetch(`/api/products/${productId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.productImages) {
            setGalleryImages(data.productImages);
          }
        })
        .catch(console.error);
    }
  }, [isEdit, productId]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !productId) return;

    setIsUploadingGallery(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload images");

      const data = await res.json();
      setGalleryImages((prev) => [...prev, ...data.images].sort((a, b) => a.displayOrder - b.displayOrder));
      
      toast({ title: "Images Uploaded", description: `Added ${data.images.length} images to gallery.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleDeleteGalleryImage = async (imageId: string) => {
    if (!confirm("Delete this image?")) return;
    
    try {
      const res = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error("Failed to delete image");
      
      setGalleryImages((prev) => prev.filter((img) => img.id !== imageId));
      toast({ title: "Image Deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleMoveGalleryImage = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === galleryImages.length - 1)
    ) return;

    const newImages = [...galleryImages];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    [newImages[index], newImages[swapIndex]] = [newImages[swapIndex], newImages[index]];
    setGalleryImages(newImages);

    // Sync with server
    try {
      const res = await fetch(`/api/admin/products/${productId}/images/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds: newImages.map(img => img.id) }),
      });
      
      if (!res.ok) throw new Error("Failed to reorder images");
    } catch (err: any) {
      toast({ title: "Error reordering", description: err.message, variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !animeSeries || !characterName || !price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("animeSeries", animeSeries);
      formData.append("characterName", characterName);
      formData.append("description", description);
      formData.append("difficulty", difficulty);
      formData.append("pageCount", pageCount);
      formData.append("price", price);
      formData.append("popularity", popularity);
      formData.append("featured", String(featured));
      formData.append("active", String(active));

      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }
      if (pdfFile) {
        formData.append("pdf", pdfFile);
      }

      setUploadProgress(40);

      const url = isEdit
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
        credentials: "include",
      });

      setUploadProgress(80);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save product");
      }

      setUploadProgress(100);

      toast({
        title: isEdit ? "Product Updated" : "Product Created",
        description: `"${title}" has been ${isEdit ? "updated" : "added"} successfully.`,
      });

      setTimeout(() => setLocation("/admin/products"), 500);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (isLoadingProduct) {
    return (
      <AdminLayout activeTab="products">
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTab="products">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => setLocation("/admin/products")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
          <h1 className="text-3xl font-heading font-bold">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h1>
        </div>

        {isSubmitting && uploadProgress > 0 && (
          <Progress value={uploadProgress} className="h-2" />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Uploads */}
          <Card>
            <CardHeader>
              <CardTitle>Files</CardTitle>
              <CardDescription>
                Upload the thumbnail image and PDF template
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <Label>
                  Thumbnail Image
                </Label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  {thumbnailPreview ? (
                    <div className="relative">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full h-40 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setThumbnailFile(null);
                          setThumbnailPreview(null);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="py-6">
                      <Image className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload thumbnail
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, WEBP (max 10MB)
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
              </div>

              {/* PDF Upload */}
              <div className="space-y-2">
                <Label>PDF Template</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => pdfInputRef.current?.click()}
                >
                  {pdfFile ? (
                    <div className="py-6">
                      <FileText className="w-10 h-10 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium">{pdfFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(pdfFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  ) : existingPdfName ? (
                    <div className="py-6">
                      <FileText className="w-10 h-10 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-medium">PDF uploaded</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click to replace
                      </p>
                    </div>
                  ) : (
                    <div className="py-6">
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload PDF
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF files (max 50MB)
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfChange}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Gallery Images (Edit Mode Only) */}
          {isEdit && (
            <Card>
              <CardHeader>
                <CardTitle>Gallery Images</CardTitle>
                <CardDescription>
                  Manage additional product images. Drag/use arrows to reorder.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {galleryImages.map((img, index) => (
                    <div key={img.id} className="relative group aspect-square rounded-md overflow-hidden border bg-muted">
                      <img src={img.imageUrl} alt="Gallery" className="w-full h-full object-cover" />
                      
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-between">
                          <Button 
                            type="button" 
                            variant="secondary" 
                            size="icon" 
                            className="h-7 w-7 bg-background/80 hover:bg-background"
                            disabled={index === 0}
                            onClick={() => handleMoveGalleryImage(index, 'up')}
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                          <Button 
                            type="button" 
                            variant="secondary" 
                            size="icon" 
                            className="h-7 w-7 bg-background/80 hover:bg-background"
                            disabled={index === galleryImages.length - 1}
                            onClick={() => handleMoveGalleryImage(index, 'down')}
                          >
                            <ArrowLeft className="h-4 w-4 rotate-180" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 self-end"
                          onClick={() => handleDeleteGalleryImage(img.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Upload New Gallery Image */}
                  <div 
                    className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/30"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    {isUploadingGallery ? (
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground">Add Images</span>
                      </>
                    )}
                  </div>
                </div>
                
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>
          )}

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="product-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Gojo Satoru - Infinity Form"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-series">
                    Anime Series <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="product-series"
                    value={animeSeries}
                    onChange={(e) => setAnimeSeries(e.target.value)}
                    placeholder="e.g. Jujutsu Kaisen"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-character">
                    Character Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="product-character"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="e.g. Gojo Satoru"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-price">
                    Price (₹) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="product-price"
                    type="number"
                    step="1"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="499"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-pages">Page Count</Label>
                  <Input
                    id="product-pages"
                    type="number"
                    min="1"
                    value={pageCount}
                    onChange={(e) => setPageCount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-popularity">Popularity Score</Label>
                  <Input
                    id="product-popularity"
                    type="number"
                    min="0"
                    max="100"
                    value={popularity}
                    onChange={(e) => setPopularity(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  id="product-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this papercraft product..."
                  rows={4}
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-3">
                  <Switch
                    id="product-featured"
                    checked={featured}
                    onCheckedChange={setFeatured}
                  />
                  <Label htmlFor="product-featured">Featured</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="product-active"
                    checked={active}
                    onCheckedChange={setActive}
                  />
                  <Label htmlFor="product-active">Active</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="min-w-[200px]"
              data-testid="button-save-product"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Update Product"
              ) : (
                "Create Product"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/admin/products")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
