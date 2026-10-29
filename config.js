// Configuration Supabase de Rivet.
// Récupère ces deux valeurs dans Supabase : Project Settings → API (ou Data API).
// La clé « anon / publishable » est faite pour être publique : la sécurité repose sur les règles RLS de schema.sql.
// Ne colle JAMAIS ici la clé « service_role » / « secret ».
window.RIVET_CONFIG = {
  SUPABASE_URL: "https://VOTRE-PROJET.supabase.co",
  SUPABASE_ANON_KEY: "VOTRE-CLE-ANON-PUBLIQUE",
};
