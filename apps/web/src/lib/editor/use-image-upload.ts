import { useRef, useState } from "react";

import { useElementMutations } from "@/lib/editor/use-element-mutations";
import { uploadImage } from "@/lib/api/files";

export function useImageUpload() {
  const { updateImageSrc } = useElementMutations();

  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput]       = useState("");
  const [showImageUrlDialog, setShowImageUrlDialog] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadElId = useRef<string | null>(null);

  async function handleImageUpload(file: File, elementId: string) {
    if (!file.type.startsWith("image/")) return;
    setUploadingImageId(elementId);
    try {
      const url = await uploadImage(file);
      await updateImageSrc({ id: elementId, src: url });
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploadingImageId(null);
    }
  }

  function handleImageUrlSubmit(elementId: string) {
    const url = imageUrlInput.trim();
    if (!url) return;
    updateImageSrc({ id: elementId, src: url });
    setImageUrlInput("");
    setShowImageUrlDialog(null);
  }

  function triggerImageUpload(elementId: string) {
    pendingUploadElId.current = elementId;
    fileInputRef.current?.click();
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const elId = pendingUploadElId.current;
    if (file && elId) { handleImageUpload(file, elId); pendingUploadElId.current = null; }
    e.target.value = "";
  }

  return {
    uploadingImageId,
    imageUrlInput, setImageUrlInput,
    showImageUrlDialog, setShowImageUrlDialog,
    fileInputRef,
    handleImageUpload, handleImageUrlSubmit, triggerImageUpload, handleFileInputChange,
  };
}
