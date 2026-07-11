import "server-only";

export function getSupabaseAdminConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server configuration is missing.");
  }

  return { url, serviceRoleKey };
}

export function createSupabaseAdminHeaders(
  serviceRoleKey: string,
  additionalHeaders?: HeadersInit,
) {
  return new Headers({
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: "application/json",
    ...additionalHeaders,
  });
}
