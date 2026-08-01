// Shared supabase config flags. NEXT_PUBLIC_* vars are inlined at build time
// so this is safe to import from both server and client code. 
// See https://nextjs.org/docs/basic-features/environment-variables#exposing-environment-variables-to-the-browser

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string ?? "";

//** True once both the project URL and anon key are present in the environment. This is used to gate access to the Supabase client. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

//** Storage bucket or uploaded media (images, videos, etc.) is stored in this bucket. This is used to construct public URLs for media. */
export const SUPABASE_MEDIA_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET as string ?? "media";