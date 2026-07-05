import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export interface WishlistItem {
  wishlistId: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    slug: string;
    price: string;
    thumbnailUrl: string | null;
    animeSeries: string;
    difficulty: string;
  };
}

export function useWishlist() {
  const { isAuthenticated } = useAuth();

  const query = useQuery<WishlistItem[]>({
    queryKey: ["wishlist"],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const res = await fetch("/api/wishlist");
      if (!res.ok) {
        throw new Error("Failed to fetch wishlist");
      }
      return res.json();
    },
    enabled: isAuthenticated,
  });

  return query;
}

export function useWishlistMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const addToWishlist = useMutation({
    mutationFn: async (productId: string) => {
      const res = await apiRequest("POST", `/api/wishlist/${productId}`);
      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("Product already in wishlist");
        }
        throw new Error("Failed to add to wishlist");
      }
      return res.json();
    },
    onMutate: async (productId) => {
      // Optimistically update the UI
      await queryClient.cancelQueries({ queryKey: ["wishlist"] });
      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(["wishlist"]);

      // We don't have the full product details here, so we add a stub.
      // This stub is enough to make the heart icon filled.
      if (previousWishlist) {
        queryClient.setQueryData<WishlistItem[]>(["wishlist"], [
          ...previousWishlist,
          {
            wishlistId: "temp-id-" + Date.now(),
            productId,
            createdAt: new Date().toISOString(),
            product: {} as any, // Stub
          },
        ]);
      }

      return { previousWishlist };
    },
    onError: (err, productId, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(["wishlist"], context.previousWishlist);
      }
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onSuccess: () => {
      toast({
        title: "Added to Wishlist",
        description: "The product has been saved to your wishlist.",
      });
    },
  });

  const removeFromWishlist = useMutation({
    mutationFn: async (productId: string) => {
      const res = await apiRequest("DELETE", `/api/wishlist/${productId}`);
      if (!res.ok) {
        throw new Error("Failed to remove from wishlist");
      }
      return res.json();
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ["wishlist"] });
      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(["wishlist"]);

      if (previousWishlist) {
        queryClient.setQueryData<WishlistItem[]>(
          ["wishlist"],
          previousWishlist.filter((item) => item.productId !== productId)
        );
      }

      return { previousWishlist };
    },
    onError: (err, productId, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(["wishlist"], context.previousWishlist);
      }
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onSuccess: () => {
      toast({
        title: "Removed from Wishlist",
        description: "The product has been removed from your wishlist.",
      });
    },
  });

  const toggleWishlist = (productId: string, isWishlisted: boolean) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use the wishlist feature.",
      });
      return;
    }

    if (isWishlisted) {
      removeFromWishlist.mutate(productId);
    } else {
      addToWishlist.mutate(productId);
    }
  };

  return {
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
  };
}
