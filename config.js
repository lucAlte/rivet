// Configuration Supabase de Rivet.
// Récupère ces deux valeurs dans Supabase : Project Settings → API (ou Data API).
// La clé « anon / publishable » est faite pour être publique : la sécurité repose sur les règles RLS de schema.sql.
// Ne colle JAMAIS ici la clé « service_role » / « secret ».
window.RIVET_CONFIG = {
  SUPABASE_URL: "https://bdwyctusuwwoaasilwri.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkd3ljdHVzdXd3b2Fhc2lsd3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMDQ4NDMsImV4cCI6MjEwODg4MDg0M30.DeQdIennWdvM9jEcSe12R5HADFUnjD_Z1XK9OZCgRPM",
};
