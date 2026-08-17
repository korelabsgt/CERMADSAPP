"use client";

import { createClient } from "@/utils/supabase/client";

export function normalizeStorageObjectPath(bucket: string, path: string): string {
  const raw = path.trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw
    .replace(/^\/+/, "")
    .replace(new RegExp(`^${bucket}/`), "");
}

export async function loadStoragePreviewUrl(
  bucket: string,
  path: string,
): Promise<string | null> {
  const raw = path.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;

  const objectPath = normalizeStorageObjectPath(bucket, raw);
  if (!objectPath) return null;

  const supabase = createClient();

  const signed = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, 3600);

  if (!signed.error && signed.data?.signedUrl) {
    return signed.data.signedUrl;
  }

  const downloaded = await supabase.storage.from(bucket).download(objectPath);
  if (!downloaded.error && downloaded.data) {
    return URL.createObjectURL(downloaded.data);
  }

  return null;
}
