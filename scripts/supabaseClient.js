import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://honghcqqtehmdjhcvxup.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvbmdoY3FxdGVobWRqaGN2eHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NDMwNzUsImV4cCI6MjA5OTQxOTA3NX0.QwY9Dw1X_5O2bcmwz-3hVpjsV_0xGssfMIPLcsSpvwU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
