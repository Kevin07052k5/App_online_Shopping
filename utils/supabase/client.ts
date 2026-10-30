import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/src/types/database'

const DEFAULT_SUPABASE_URL = 'https://iztuzmxcsiwcqppqtjnl.supabase.co'
const DEFAULT_SUPABASE_KEY = 'sb_publishable_Ua5z7vWtiLKFm1wnR1BZQQ_v1XVr01N'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_KEY

export const createClient = () =>
  createBrowserClient<any>(supabaseUrl, supabaseKey)
