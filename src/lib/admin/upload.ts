import { createClient } from "@/lib/supabase/client";
import { SUPABASE_MEDIA_BUCKET } from "@/lib/supabase/config";

/**
 * Uploads a file to Supabase Storage (as the logged-in admin) and returns its
 * public URL. Called from admin client components only.
 */
export async function uploadFile(file: File, folder: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(SUPABASE_MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(SUPABASE_MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}