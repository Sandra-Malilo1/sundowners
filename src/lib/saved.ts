import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface SavedState {
  signedIn: boolean;
  ids: string[];
}

async function fetchSaved(): Promise<SavedState> {
  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session) return { signedIn: false, ids: [] };
  const { data, error } = await supabase.from('saved_properties').select('property_id');
  if (error) throw error;
  return { signedIn: true, ids: (data ?? []).map((r: { property_id: string }) => r.property_id) };
}

/** Wishlist state shared by every heart button on the page (one query, many cards). */
export function useSaved() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['saved-ids'], queryFn: fetchSaved, staleTime: 60_000 });
  const ids = q.data?.ids ?? [];

  /** Returns 'login' when the visitor must sign in first. */
  const toggle = async (propertyId: string): Promise<'login' | 'saved' | 'removed'> => {
    const { data: auth } = await supabase.auth.getSession();
    const uid = auth.session?.user.id;
    if (!uid) return 'login';

    const was = ids.includes(propertyId);
    qc.setQueryData<SavedState>(['saved-ids'], {
      signedIn: true,
      ids: was ? ids.filter((i) => i !== propertyId) : [...ids, propertyId],
    });

    const { error } = was
      ? await supabase.from('saved_properties').delete().eq('property_id', propertyId)
      : await supabase.from('saved_properties').insert({ user_id: uid, property_id: propertyId, source: 'manual' });

    if (error) {
      await qc.invalidateQueries({ queryKey: ['saved-ids'] }); // put the heart back
      throw error;
    }
    qc.invalidateQueries({ queryKey: ['wishlist'] });
    return was ? 'removed' : 'saved';
  };

  return { ids, isSaved: (id: string) => ids.includes(id), toggle };
}