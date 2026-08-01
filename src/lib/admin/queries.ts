import { createClient } from "@/lib/supabase/server"
import {
  mapProjectRow,
  mapTestimonialRow,
  mapSettingsRow,
  mapPostRow,
  mapToolRow,
  defaultSettings,
} from "@/lib/queries"
import type { Project, Testimonial, SiteSettings, Post, Tool } from "@/lib/types";

export async function getListProjects() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("year", { ascending: false });
  return (data ?? []).map(mapProjectRow);
}

export async function getProjectById(id: string): Promise<Project|null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? mapProjectRow(data) : null;
}

export async function getListTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapTestimonialRow);
}

export async function getSettingsForAdmin() : Promise<SiteSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return data ? mapSettingsRow(data) : defaultSettings;
}

export async function getListPosts(): Promise<Post[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapPostRow);
}

export async function getPostById(id: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? mapPostRow(data) : null;
}

export async function getListTools(): Promise<Tool[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tools")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapToolRow);
}

export async function getToolById(id: string): Promise<Tool | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tools")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? mapToolRow(data) : null;
}