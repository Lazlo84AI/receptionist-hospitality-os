import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wutdtsokfqfwxmzmcpqt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1dGR0c29rZnFmd3htem1jcHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NTczNTEsImV4cCI6MjA2ODMzMzM1MX0.VQjXq9HeTAxznjyqRYv7JWm63MxjbvlT4ka0D53uWZ8'

export const supabase = createClient(supabaseUrl, supabaseKey)