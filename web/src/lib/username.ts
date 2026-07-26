// Matches the `profiles.username` check constraint in
// supabase/migration-010-user-quotes.sql — kept in sync manually since
// there's no shared schema source between the DB and the app.
export const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return USERNAME_PATTERN.test(value);
}
