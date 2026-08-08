import { apiUpload } from "@/lib/api/client";

export async function uploadImage(file: File): Promise<string> {
  const result = await apiUpload<{ url: string }>("/files", file);
  return result.url;
}
