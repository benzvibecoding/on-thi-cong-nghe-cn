import { z } from "zod";

const envSchema = z.object({
  /** Server-only. Public site URL for sitemap/robots/metadata. Never NEXT_PUBLIC_. */
  SITE_URL: z.string().min(1).default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

/** Validated environment. Optional cloud/AI keys stay undefined in local-first mode. */
export function getEnv(): AppEnv {
  if (cached) return cached;
  cached = envSchema.parse({
    SITE_URL: process.env.SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
  });
  return cached;
}

export function isCloudEnabled(): boolean {
  const env = getEnv();
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isAiEnabled(): boolean {
  const env = getEnv();
  return Boolean(env.GEMINI_API_KEY && env.GEMINI_MODEL);
}
