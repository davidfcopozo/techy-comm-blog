import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "../supabaseConfig";
import { useQueryClient } from "@tanstack/react-query";
import { ImageInterface, ImageMetadata } from "@/typings/interfaces";
import { UserType } from "@/typings/types";
import usePostRequest from "./usePostRequest";
import useDeleteImages from "./useDeleteImages";
import useFetchRequest from "./useFetchRequest";
import usePatchRequest from "./usePatchRequest";
import { AxiosError } from "axios";
import { useSessionUserId } from "./useSessionUserId";
import { clearCache } from "@/utils/request-cache";
import getImageHash from "@/utils/getImageHash";

export const useImageManager = () => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const { userId: currentUserId } = useSessionUserId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getCurrentUser = useCallback(() => {
    const queryCache = queryClient.getQueryCache();
    const currentUserQueries = queryCache.findAll({
      predicate: (query) => {
        return (
          Array.isArray(query.queryKey) && query.queryKey[0] === "currentUser"
        );
      },
    });

    for (const query of currentUserQueries) {
      const data = queryClient.getQueryData<{ data: UserType }>(query.queryKey);
      if (data && data.data && data.data._id) {
        return data;
      }
    }
    return null;
  }, [queryClient]);

  const currentUser = getCurrentUser();
  const userId = currentUser?.data?._id || currentUserId;

  const {
    data: userImagesData,
    isLoading: isLoadingImages,
    refetch: refetchImages,
  } = useFetchRequest(
    ["user-images", userId],
    userId ? `/api/users/${userId}/images` : null
  );

  const { mutate: storeImageMetadata } = usePostRequest({
    url: userId ? `/api/users/${userId}/images` : "",
    onSuccess: () => {
      if (userId) {
        clearCache(`/api/users/${userId}/images`);
        queryClient.invalidateQueries({
          queryKey: ["user-images", userId],
        });
        queryClient.invalidateQueries({
          queryKey: ["preview-post"],
        });
      }
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    },
    onError: (error: AxiosError) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to upload image: ${error.message}`,
      });
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["user-images", userId] });
      const previousData = queryClient.getQueryData(["user-images", userId]);
      return { previousData };
    },
  });

  const { mutate: deleteImageMetadata, error: deleteImageError } =
    useDeleteImages({
      url: userId ? `/api/users/${userId}/images` : "",
      onSuccess: () => {
        if (userId) {
          clearCache(`/api/users/${userId}/images`);
          queryClient.invalidateQueries({
            queryKey: ["user-images", userId],
          });
          // Also invalidate preview post caches since cover images might have been deleted
          queryClient.invalidateQueries({
            queryKey: ["preview-post"],
          });
        }
        toast({
          title: "Success",
          description: "Image deleted successfully",
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to delete image: ${error?.message}`,
        });
      },
    });

  const { mutate: updateImageMutation } = usePatchRequest({
    url: `/api/users/${userId}/images`,
    onSuccess: () => {
      if (userId) {
        // Clear the request cache first
        clearCache(`/api/users/${userId}/images`);
        queryClient.invalidateQueries({ queryKey: ["user-images", userId] });
        // Also invalidate preview post caches since cover images might have been updated
        queryClient.invalidateQueries({
          queryKey: ["preview-post"],
        });
      }
      toast({
        title: "Success",
        description: "Image updated successfully",
      });
    },
    onError: (error: AxiosError) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update image: ${error.message}`,
      });
    },
  });

  const updateImageMetadata = useCallback(
    async (imageId: string, updates: Partial<ImageInterface>) => {
      try {
        await updateImageMutation({
          imageId,
          updates,
        });

        if (userId) {
          clearCache(`/api/users/${userId}/images`);
          queryClient.invalidateQueries({
            queryKey: ["user-images", userId],
          });
          // Also invalidate preview post caches since cover images might have been updated
          queryClient.invalidateQueries({
            queryKey: ["preview-post"],
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        toast({
          variant: "destructive",
          title: "Error updating image",
          description: `Failed to update image: ${errorMessage}`,
        });
        throw error;
      }
    },
    [updateImageMutation, toast, userId, queryClient]
  );

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      // Stop if already uploading
      if (uploading) {
        toast({
          title: "Upload in progress",
          description: "Please wait for the current upload to finish.",
        });
        throw new Error("Upload in progress");
      }

      setUploading(true);

      const currentUser = getCurrentUser();
      if (!currentUser) {
        setUploading(false);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please ensure you are logged in and try again.",
        });
        throw new Error("User not authenticated");
      }

      const currentUserId = `${currentUser.data._id}`;

      if (!currentUserId) {
        setUploading(false);
        throw new Error("User not authenticated");
      }
      let downloadURL = "";

      try {
        const hash = await getImageHash(file);

        if (userId) {
          clearCache(`/api/users/${userId}/images`);
        }
        await refetchImages();

        // Get fresh image data after refetch
        const currentImages = queryClient.getQueryData<{
          data: ImageInterface[];
        }>(["user-images", userId]);
        const existingImages = currentImages?.data || [];

        const duplicateImage = existingImages.find(
          (image: ImageInterface) => image.hash === hash
        );

        if (duplicateImage) {
          setUploading(false);
          toast({
            title: "Duplicate image",
            description: `An image with the same content already exists: ${duplicateImage.name}`,
          });
          return duplicateImage.url; // Return the URL of the existing image
        }

        // Generate a unique filename
        const id = `${file.name.split(".")[0]}-${Date.now()}`;
        const idWithoutSpaces = id.replace(/\s+/g, "-");
        const fileName = encodeURIComponent(idWithoutSpaces);
        const filePath = `${currentUserId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, file, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);

        downloadURL = publicUrlData.publicUrl;

        const dimensions = await getImageDimensions(file);

        const imageMetadata: ImageMetadata = {
          url: downloadURL,
          name: file.name,
          size: file.size,
          type: file.type,
          dimensions: `${dimensions.width}x${dimensions.height}`,
          createdAt: new Date(),
          title: file.name.split(".")[0],
          altText: "",
          tags: [],
          hash,
        };

        storeImageMetadata({ images: imageMetadata });

        setUploading(false);
        return downloadURL;
      } catch (error) {
        setUploading(false);
        // If metadata storage fails but Supabase upload succeeded, clean up the uploaded file
        if (downloadURL) {
          try {
            const id = `${file.name.split(".")[0]}-${Date.now()}`;
            const idWithoutSpaces = id.replace(/\s+/g, "-");
            const fileName = encodeURIComponent(idWithoutSpaces);
            const filePath = `${currentUserId}/${fileName}`;

            await supabase.storage.from("images").remove([filePath]);
          } catch (cleanupError) {
            console.error(
              "Failed to clean up orphaned Supabase image:",
              cleanupError
            );
          }
        }

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        const isDuplicateError =
          typeof errorMessage === "string" &&
          (errorMessage.toLowerCase().includes("duplicate") ||
            errorMessage.toLowerCase().includes("duplicated"));

        toast({
          title: isDuplicateError ? "Duplicate image" : "Error uploading image",
          description: `${errorMessage}`,
        });

        throw error;
      }
    },
    [
      getCurrentUser,
      queryClient,
      refetchImages,
      toast,
      storeImageMetadata,
      uploading,
      userId,
    ]
  );

  const deleteImage = useCallback(
    async (imageId: string) => {
      if (!imageId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No image ID provided for deletion",
        });
        return;
      }

      setDeleting(true);

      const currentUser = getCurrentUser();

      if (!currentUser) {
        setDeleting(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: "User not authenticated",
        });
        return;
      }

      const images = userImagesData?.data || [];
      const imageToDelete = images.find(
        (img: ImageInterface) => img._id?.toString() === imageId
      );

      if (!imageToDelete) {
        setDeleting(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Image not found",
        });
        return;
      }

      try {
        // Call the API to delete the metadata
        await deleteImageMetadata({ itemId: imageId });

        // Only proceed with Supabase deletion if MongoDB deletion succeeded
        try {
          const imageUrl = imageToDelete.url;
          let storagePath = "";

          if (imageUrl.includes("/storage/v1/object/public/images/")) {
            storagePath = imageUrl.split("/storage/v1/object/public/images/")[1];
          } else if (imageUrl.includes("/images/")) {
            storagePath = imageUrl.split("/images/")[1]?.split("?")[0];
          }

          if (storagePath) {
            const decodedPath = decodeURIComponent(storagePath);
            const { error: removeError } = await supabase.storage
              .from("images")
              .remove([decodedPath]);

            if (removeError) {
              console.warn(
                "Supabase deletion issue (non-critical):",
                removeError.message
              );
            }
          } else {
            console.warn("Could not parse image path from URL:", imageUrl);
          }
        } catch (storageError: any) {
          console.warn(
            "Supabase deletion issue (non-critical):",
            storageError.message
          );
        }

        setDeleting(false);
      } catch (error: any) {
        setDeleting(false);
        toast({
          variant: "destructive",
          title: "Error deleting image",
          description: error?.message || "Unknown error occurred",
        });
        console.error("Image deletion error:", error);
      }
    },
    [getCurrentUser, deleteImageMetadata, userImagesData, toast]
  );

  const getImageDimensions = (
    file: File
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src); // Clean up
      };
      img.src = URL.createObjectURL(file);
    });
  };

  return {
    uploadImage,
    deleteImage,
    updateImageMetadata,
    userImages: userImagesData?.data || [],
    isLoadingImages,
    uploading,
    deleting,
    refetchImages,
    isUserLoaded: !!userId,
  };
};
