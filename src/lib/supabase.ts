import { createClient } from '@supabase/supabase-js';
import { Slang } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function fetchSlangs(): Promise<Slang[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('slangs')
    .select('*')
    .order('term', { ascending: true });
console.log(data);
  if (error) {
    console.error('Error fetching slangs:', error);
    return [];
  }

  return data as Slang[];
}
