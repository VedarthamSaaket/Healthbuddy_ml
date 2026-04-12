import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// For frontend operations, we use the Anon Key
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Common usage pattern:
 * async function testConnection() {
 *   const { data, error } = await supabase.from('users').select('*').limit(1)
 *   return { data, error }
 * }
 */
