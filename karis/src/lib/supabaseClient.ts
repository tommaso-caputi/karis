import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const missingEnv = !supabaseUrl || !supabaseAnonKey;

if (missingEnv) {
    // Surface a clear warning in development when env vars are missing.
    console.warn(
        "Supabase non è configurato: imposta NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
}

export const supabase: SupabaseClient | null = missingEnv
    ? null
    : createClient(supabaseUrl!, supabaseAnonKey!);

