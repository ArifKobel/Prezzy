import { api } from "@Prezzy/backend/convex/_generated/api";
import type { Id } from "@Prezzy/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useRef, useState } from "react";

export function useImageUpload() {
  const updateImageSrc = useMutation(api.slideElements.updateImageSrc);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const setImageFromStorage = useMutation(api.slideElements.setImageFromStorage);

  const [uploadingImageId, setUploadingImageId] = useState<Id<"slideElements"> | null>(null);
  const [imageUrlInput, setImageUrlInput]       = useState("");
  const [showImageUrlDialog, setShowImageUrlDialog] = useState<Id<"slideElements"> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadElId = useRef<Id<"slideElements"> | null>(null);

  async function handleImageUpload(file: File, elementId: Id<"slideElements">) {
    if (!file.type.startsWith("image/")) return;
    setUploadingImageId(elementId);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await result.json();
      await setImageFromStorage({ id: elementId, storageId });
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploadingImageId(null);
    }
  }

  function handleImageUrlSubmit(elementId: Id<"slideElements">) {
    const url = imageUrlInput.trim();
    if (!url) return;
    updateImageSrc({ id: elementId, src: url });
    setImageUrlInput("");
    setShowImageUrlDialog(null);
  }

  function triggerImageUpload(elementId: Id<"slideElements">) {
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
