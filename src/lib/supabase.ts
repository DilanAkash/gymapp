import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://oovuhpjpzfozidcxhgsd.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnVocGpwemZvemlkY3hoZ3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNzgxODYsImV4cCI6MjA3Mjg1NDE4Nn0.iIyRBYnnw9HH4VKIgU1x5rtLy8rsRXV1hqvd2iZ-fNU"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
