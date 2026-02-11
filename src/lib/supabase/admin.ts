import { createClient } from '@supabase/supabase-js';

// NOTA: Este cliente SOLO debe usarse en el servidor (Server Actions / API Routes)
// ya que utiliza la clave secreta SERVICE_ROLE_KEY que tiene permisos totales.
export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}
