import { supabase } from "@/integrations/supabase/client";

const BUCKET = "issue-images";
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPG, PNG, or WebP images are allowed.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be smaller than 10 MB.";
  }
  return null;
}

/**
 * Uploads an image to the issue-images bucket and returns a long-lived signed URL.
 * Throws on failure.
 */
export async function uploadIssueImage(file: File, userEmail: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeUser = userEmail.replace(/[^a-zA-Z0-9]/g, "_");
  const path = `${safeUser}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });
  if (upErr) throw new Error(upErr.message);

  // 10 years
  const { data, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (signErr || !data?.signedUrl) {
    throw new Error(signErr?.message ?? "Failed to generate image URL");
  }
  return data.signedUrl;
}
